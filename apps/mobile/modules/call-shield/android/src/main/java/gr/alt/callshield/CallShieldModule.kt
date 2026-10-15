package gr.alt.callshield

import android.Manifest
import android.app.role.RoleManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val ROLE_REQUEST = 7201

class CallShieldModule : Module() {
    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("No React context")
    private var pendingRole: Promise? = null

    override fun definition() = ModuleDefinition {
        Name("CallShield")
        Events("onCallScreened", "onCallEnded")

        OnCreate { EventBridge.attach { name, payload -> sendEvent(name, payload) } }
        OnDestroy { EventBridge.detach() }

        Function("isSupported") { Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q }

        /** Everything the setup-health monitor needs; uploaded to devices.health by JS. */
        Function("getHealth") { health(context) }

        AsyncFunction("requestScreeningRole") { promise: Promise ->
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return@AsyncFunction promise.resolve(false)
            val rm = context.getSystemService(RoleManager::class.java)
            if (rm.isRoleHeld(RoleManager.ROLE_CALL_SCREENING)) return@AsyncFunction promise.resolve(true)
            val activity = appContext.currentActivity ?: return@AsyncFunction promise.resolve(false)
            pendingRole = promise
            activity.startActivityForResult(rm.createRequestRoleIntent(RoleManager.ROLE_CALL_SCREENING), ROLE_REQUEST)
        }

        OnActivityResult { _, payload ->
            if (payload.requestCode == ROLE_REQUEST) {
                pendingRole?.resolve(roleHeld(context))
                pendingRole = null
            }
        }

        Function("openOverlaySettings") {
            open(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}")))
        }
        Function("openBatterySettings") {
            // No REQUEST_IGNORE_BATTERY_OPTIMIZATIONS permission: we send the user to the system list instead.
            open(Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))
        }
        Function("openNotificationSettings") {
            open(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName))
        }
        Function("openFullScreenIntentSettings") {
            if (Build.VERSION.SDK_INT >= 34) {
                open(Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${context.packageName}")))
            }
        }
        Function("openAppSettings") {
            open(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
        }

        /** Replaces the on-device screening cache (family, official directory, reputation, labels). */
        Function("writeCache") { json: String -> CacheStore.write(context, json) }

        /** Screened-call events since the last drain, as a JSON array string. */
        Function("drainEvents") { CallEventQueue.drain(context).toString() }
    }

    private fun open(intent: Intent) {
        val activity = appContext.currentActivity
        if (activity != null) activity.startActivity(intent) else context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    companion object {
        fun roleHeld(context: Context): Boolean =
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && context.getSystemService(RoleManager::class.java).isRoleHeld(RoleManager.ROLE_CALL_SCREENING)

        fun health(context: Context): Map<String, Any?> {
            val pm = context.getSystemService(PowerManager::class.java)
            return mapOf(
                "supported" to (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q),
                "callScreeningRole" to roleHeld(context),
                "notifications" to NotificationManagerCompat.from(context).areNotificationsEnabled(),
                "overlay" to Settings.canDrawOverlays(context),
                "batteryExempt" to pm.isIgnoringBatteryOptimizations(context.packageName),
                "fullScreenIntent" to WarningPresenter.canUseFullScreenIntent(context),
                "phoneState" to (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED),
                "cacheUpdatedAt" to CacheStore.file(context).let { if (it.exists()) it.lastModified() else null },
                "sdk" to Build.VERSION.SDK_INT,
            )
        }
    }
}
