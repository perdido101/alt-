package gr.alt.callshield

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Screened calls waiting to be uploaded to call_events by JS (the service can't reach the network reliably
 * within the screening time limit). One JSON object per line; JS drains it.
 */
object CallEventQueue {
    private fun file(context: Context) = File(context.filesDir, "callshield/events.jsonl").also { it.parentFile?.mkdirs() }

    @Synchronized
    fun append(context: Context, event: JSONObject) {
        file(context).appendText(event.toString() + "\n")
    }

    @Synchronized
    fun drain(context: Context): JSONArray {
        val f = file(context)
        val out = JSONArray()
        if (!f.exists()) return out
        f.readLines().filter { it.isNotBlank() }.forEach { line -> runCatching { out.put(JSONObject(line)) } }
        f.delete()
        return out
    }
}
