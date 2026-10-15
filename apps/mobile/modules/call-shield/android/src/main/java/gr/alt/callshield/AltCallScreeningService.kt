package gr.alt.callshield

import android.os.Build
import android.telecom.Call
import android.telecom.CallScreeningService
import androidx.annotation.RequiresApi
import gr.alt.callshield.logic.CallAction
import gr.alt.callshield.logic.ScreeningDecider
import org.json.JSONObject
import java.util.UUID

/**
 * Screens every incoming call against the on-device cache (works offline, well inside the system's time limit).
 * Never blocks answering or declining unless the guardian chose "Block" and the number is a reported scam.
 */
@RequiresApi(Build.VERSION_CODES.Q)
class AltCallScreeningService : CallScreeningService() {
    override fun onScreenCall(details: Call.Details) {
        if (details.callDirection != Call.Details.DIRECTION_INCOMING) {
            respondToCall(details, CallResponse.Builder().build())
            return
        }
        val cache = runCatching { CacheStore.get(applicationContext) }.getOrNull()
        val raw = details.handle?.schemeSpecificPart
        if (cache == null) {
            respondToCall(details, CallResponse.Builder().build())
            return
        }
        val decision = ScreeningDecider.decide(raw, cache.screening)

        // Respond first: the system only waits a few seconds.
        val response = CallResponse.Builder()
        when (decision.action) {
            CallAction.REJECT -> response.setDisallowCall(true).setRejectCall(true).setSkipNotification(false).setSkipCallLog(false)
            CallAction.SILENCE -> response.setSilenceCall(true)
            CallAction.ALLOW -> {}
        }
        respondToCall(details, response.build())

        val localId = UUID.randomUUID().toString()
        val event = JSONObject()
            .put("type", "screened")
            .put("localId", localId)
            .put("numberKey", decision.number.key ?: JSONObject.NULL)
            .put("numberKind", decision.number.kind.name.lowercase())
            .put("classification", decision.classification.wire)
            .put("reason", decision.reason.wire)
            .put("action", if (decision.warn && decision.action == CallAction.ALLOW) "warned" else decision.action.wire)
            .put("officialId", decision.official?.id ?: JSONObject.NULL)
            .put("checkIn", decision.checkIn)
            .put("label", WarningPresenter.title(decision, cache.strings))
            .put("who", WarningPresenter.who(decision, cache.strings))
            .put("startedAt", System.currentTimeMillis())
        CallEventQueue.append(applicationContext, event)
        if (decision.checkIn) CallSession.start(applicationContext, event)
        if (decision.warn) WarningPresenter.showRinging(applicationContext, decision, cache)
        EventBridge.emit("onCallScreened", mapOf("classification" to decision.classification.wire, "localId" to localId))
    }
}
