package gr.alt.callshield

import android.content.Context
import gr.alt.callshield.logic.CallStateTracker
import org.json.JSONObject

/** The call currently being tracked (persisted, since the receiver may run in a fresh process). */
object CallSession {
    private const val PREFS = "alt_callshield"

    fun start(context: Context, event: JSONObject) {
        prefs(context).edit().putString("current", event.toString()).apply()
    }

    fun current(context: Context): JSONObject? = prefs(context).getString("current", null)?.let { runCatching { JSONObject(it) }.getOrNull() }

    fun clear(context: Context) = prefs(context).edit().remove("current").apply()

    fun tracker(context: Context): CallStateTracker {
        val p = prefs(context)
        return CallStateTracker().apply {
            restore(CallStateTracker.State.valueOf(p.getString("state", "IDLE")!!), p.getBoolean("answered", false))
        }
    }

    fun save(context: Context, tracker: CallStateTracker) {
        val (state, answered) = tracker.snapshot()
        prefs(context).edit().putString("state", state.name).putBoolean("answered", answered).apply()
    }

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
}
