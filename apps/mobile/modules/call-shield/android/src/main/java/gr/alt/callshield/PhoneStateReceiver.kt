package gr.alt.callshield

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import gr.alt.callshield.logic.CallStateTracker
import org.json.JSONObject

/**
 * Detects the end of an answered call (needs READ_PHONE_STATE; no call log access).
 * If the call was screened as non-family, posts the "Μόλις μίλησες με…" check-in.
 */
class PhoneStateReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != TelephonyManager.ACTION_PHONE_STATE_CHANGED) return
        val state = when (intent.getStringExtra(TelephonyManager.EXTRA_STATE)) {
            TelephonyManager.EXTRA_STATE_RINGING -> CallStateTracker.State.RINGING
            TelephonyManager.EXTRA_STATE_OFFHOOK -> CallStateTracker.State.OFFHOOK
            TelephonyManager.EXTRA_STATE_IDLE -> CallStateTracker.State.IDLE
            else -> return
        }
        val tracker = CallSession.tracker(context)
        val (previous, wasAnswered) = tracker.snapshot()
        val ended = tracker.onState(state)
        CallSession.save(context, tracker)

        if (state == CallStateTracker.State.OFFHOOK || state == CallStateTracker.State.IDLE) WarningPresenter.clearRinging(context)
        if (state != CallStateTracker.State.IDLE || previous == CallStateTracker.State.IDLE) return

        val session = CallSession.current(context) ?: return
        CallSession.clear(context)
        val startedAt = session.optLong("startedAt")
        // Ignore a stale session (e.g. the receiver missed the start of the call).
        if (System.currentTimeMillis() - startedAt > 3 * 60 * 60_000L) return
        val localId = session.getString("localId")
        CallEventQueue.append(
            context,
            JSONObject().put("type", "ended").put("localId", localId).put("endedAt", System.currentTimeMillis()).put("answered", ended || wasAnswered),
        )
        if (ended && session.optBoolean("checkIn")) {
            val cache = CacheStore.get(context)
            WarningPresenter.showCheckIn(context, localId, session.optString("who"), cache)
            EventBridge.emit("onCallEnded", mapOf("localId" to localId))
        }
    }
}
