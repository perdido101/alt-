package gr.alt.callshield

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import gr.alt.callshield.logic.Classification
import gr.alt.callshield.logic.Decision
import gr.alt.callshield.logic.Reason

/**
 * Shows the ringing warning and the after-call check-in.
 *
 * While the phone rings we never cover the answer/decline controls: the warning is a heads-up notification
 * plus, if the user allowed "display over other apps", a touch-through banner at the top of the screen.
 * Full-screen intents are used only for the after-call check-in, when no call UI is showing.
 */
object WarningPresenter {
    private const val CHANNEL_WARN = "callshield_warning"
    private const val CHANNEL_CHECKIN = "callshield_checkin"
    private const val NOTIF_WARN = 7101
    private const val NOTIF_CHECKIN = 7102
    private const val BANNER_MS = 20_000L

    private val main = Handler(Looper.getMainLooper())
    private var banner: View? = null

    fun title(decision: Decision, s: NativeStrings): String = when (decision.classification) {
        Classification.OFFICIAL -> s.get("officialTitle", "✓ {org}").replace("{org}", decision.official?.organisation ?: "")
        Classification.REPORTED_SCAM -> s.get("reportedTitle", "Πιθανή απάτη")
        Classification.RISKY -> when (decision.reason) {
            Reason.HIDDEN -> s.get("riskyHidden", "Απόκρυψη αριθμού")
            Reason.INTERNATIONAL -> s.get("riskyInternational", "Κλήση από το εξωτερικό")
            Reason.FLAGGED -> s.get("riskyFlagged", "Ύποπτος αριθμός")
            else -> s.get("riskyTitle", "Ύποπτη κλήση")
        }
        Classification.FAMILY -> s.get("familyLabel", "Οικογένεια")
        Classification.UNKNOWN -> s.get("unknownTitle", "Άγνωστος αριθμός")
    }

    fun body(decision: Decision, s: NativeStrings): String {
        val base = s.get("body", "Αν σου ζητήσουν λεφτά ή κωδικούς, κλείσε και πάρε την οικογένεια.")
        return if (decision.classification == Classification.OFFICIAL) "${s.get("officialReminder")}\n$base".trim() else base
    }

    private fun ensureChannels(context: Context, s: NativeStrings) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val nm = context.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_WARN, s.get("warnChannel", "Προειδοποιήσεις κλήσεων"), NotificationManager.IMPORTANCE_HIGH).apply {
                setSound(null, null) // the phone is already ringing
                enableVibration(false)
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            },
        )
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL_CHECKIN, s.get("checkinChannel", "Μετά από κλήση"), NotificationManager.IMPORTANCE_HIGH).apply {
                lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
            },
        )
    }

    private fun color(c: NativeStrings, key: String, fallback: String) = runCatching { Color.parseColor(c.get(key, fallback)) }.getOrDefault(Color.parseColor(fallback))

    fun showRinging(context: Context, decision: Decision, cache: LoadedCache) {
        val s = cache.strings
        ensureChannels(context, s)
        val title = title(decision, s)
        val body = body(decision, s)
        if (NotificationManagerCompat.from(context).areNotificationsEnabled()) {
            val n = NotificationCompat.Builder(context, CHANNEL_WARN)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setColor(color(cache.colors, "accent", "#C2410C"))
                .setTimeoutAfter(60_000)
                .setAutoCancel(true)
                .build()
            runCatching { NotificationManagerCompat.from(context).notify(NOTIF_WARN, n) }
        }
        if (Settings.canDrawOverlays(context)) main.post { showBanner(context, title, body, cache.colors) }
    }

    private fun showBanner(context: Context, title: String, body: String, colors: NativeStrings) {
        hideBanner(context)
        val wm = context.getSystemService(WindowManager::class.java)
        val dp = { v: Float -> TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, context.resources.displayMetrics).toInt() }
        val fg = color(colors, "onSurface", "#FFFFFF")
        val view = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20f), dp(18f), dp(20f), dp(18f))
            background = GradientDrawable().apply {
                setColor(color(colors, "surface", "#22302F"))
                cornerRadius = dp(24f).toFloat()
                setStroke(dp(3f), color(colors, "accent", "#C2410C"))
            }
            addView(TextView(context).apply {
                text = title
                setTextColor(fg)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 24f)
                setTypeface(typeface, Typeface.BOLD)
            })
            addView(TextView(context).apply {
                text = body
                setTextColor(fg)
                setTextSize(TypedValue.COMPLEX_UNIT_SP, 19f)
                setPadding(0, dp(6f), 0, 0)
            })
            importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_YES
            contentDescription = "$title. $body"
        }
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            // Never focusable or touchable: answering and declining must keep working underneath.
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.TOP
            x = 0
            y = dp(48f)
            horizontalMargin = 0.03f
        }
        runCatching {
            wm.addView(view, params)
            banner = view
            main.postDelayed({ hideBanner(context) }, BANNER_MS)
        }
    }

    fun hideBanner(context: Context) {
        val v = banner ?: return
        banner = null
        main.post { runCatching { context.getSystemService(WindowManager::class.java).removeView(v) } }
    }

    fun clearRinging(context: Context) {
        hideBanner(context)
        NotificationManagerCompat.from(context).cancel(NOTIF_WARN)
    }

    /** Who the parent just spoke with: "697 777 7777", "100 (Ελληνική Αστυνομία)" or "απόκρυψη αριθμού". */
    fun who(decision: Decision, s: NativeStrings): String {
        val number = decision.number.display ?: return s.get("hiddenWho", "απόκρυψη αριθμού")
        return decision.official?.let { "$number (${it.organisation})" } ?: number
    }

    /** "Μόλις μίλησες με…" check-in, opening alt://parent/call/after?localId=… */
    fun showCheckIn(context: Context, localId: String, who: String, cache: LoadedCache) {
        val s = cache.strings
        ensureChannels(context, s)
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return
        val uri = Uri.parse("alt://parent/call/after?localId=${Uri.encode(localId)}")
        val intent = Intent(Intent.ACTION_VIEW, uri).setPackage(context.packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        val pi = PendingIntent.getActivity(context, localId.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val title = s.get("checkinTitle", "Μόλις μίλησες με {who}").replace("{who}", who)
        val body = s.get("checkinBody", "Σου ζήτησαν χρήματα, κωδικούς, ή είπαν ότι κάποιος δικός σου έχει πρόβλημα;")
        val builder = NotificationCompat.Builder(context, CHANNEL_CHECKIN)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setContentIntent(pi)
            .setAutoCancel(true)
            .setTimeoutAfter(30 * 60_000L)
        if (canUseFullScreenIntent(context)) builder.setFullScreenIntent(pi, true)
        runCatching { NotificationManagerCompat.from(context).notify(NOTIF_CHECKIN, builder.build()) }
    }

    fun canUseFullScreenIntent(context: Context): Boolean =
        if (Build.VERSION.SDK_INT >= 34) context.getSystemService(NotificationManager::class.java).canUseFullScreenIntent() else true
}
