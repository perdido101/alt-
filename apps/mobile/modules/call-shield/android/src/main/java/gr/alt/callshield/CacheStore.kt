package gr.alt.callshield

import android.content.Context
import gr.alt.callshield.logic.OfficialEntry
import gr.alt.callshield.logic.ProtectionLevel
import gr.alt.callshield.logic.Reputation
import gr.alt.callshield.logic.ScreeningCache
import org.json.JSONObject
import java.io.File

/** Labels and colours for native UI, provided by JS from the shared i18n catalogs and design tokens. */
data class NativeStrings(val json: JSONObject) {
    fun get(key: String, fallback: String = ""): String = json.optString(key, fallback)
}

data class LoadedCache(val screening: ScreeningCache, val strings: NativeStrings, val colors: NativeStrings)

/**
 * The on-device copy of family numbers, the official directory and reputation, written by JS
 * (writeCache) and read by the screening service. Reloaded only when the file changes.
 */
object CacheStore {
    private var loaded: LoadedCache? = null
    private var loadedAt = 0L

    fun file(context: Context): File = File(context.filesDir, "callshield/cache.json").also { it.parentFile?.mkdirs() }

    fun write(context: Context, json: String) {
        JSONObject(json) // validate before replacing the old cache
        val target = file(context)
        val tmp = File(target.parentFile, "cache.json.tmp")
        tmp.writeText(json)
        tmp.renameTo(target)
        synchronized(this) { loadedAt = 0L }
    }

    @Synchronized
    fun get(context: Context): LoadedCache {
        val f = file(context)
        val current = loaded
        if (current != null && f.exists() && f.lastModified() == loadedAt) return current
        val parsed = if (f.exists()) runCatching { parse(JSONObject(f.readText())) }.getOrNull() else null
        val result = parsed ?: empty()
        loaded = result
        loadedAt = if (f.exists()) f.lastModified() else 0L
        return result
    }

    private fun empty() = LoadedCache(ScreeningCache(emptySet(), emptyMap(), emptyMap()), NativeStrings(JSONObject()), NativeStrings(JSONObject()))

    private fun parse(o: JSONObject): LoadedCache {
        val family = o.optJSONArray("family")?.let { a -> (0 until a.length()).map { a.getString(it) }.toSet() } ?: emptySet()
        val official = mutableMapOf<String, OfficialEntry>()
        o.optJSONArray("official")?.let { a ->
            for (i in 0 until a.length()) {
                val e = a.getJSONObject(i)
                official[e.getString("key")] = OfficialEntry(e.getString("id"), e.getString("organisation"), e.getString("category"), e.optString("displayNumber"))
            }
        }
        val reputation = mutableMapOf<String, Reputation>()
        o.optJSONArray("reputation")?.let { a ->
            for (i in 0 until a.length()) {
                val e = a.getJSONObject(i)
                reputation[e.getString("key")] = Reputation(e.optInt("approvedReports"), e.optBoolean("flagged"))
            }
        }
        val screening = ScreeningCache(
            family = family,
            official = official,
            reputation = reputation,
            reportThreshold = o.optInt("reportThreshold", 3),
            protectionLevel = ProtectionLevel.from(o.optString("protectionLevel")),
        )
        return LoadedCache(screening, NativeStrings(o.optJSONObject("strings") ?: JSONObject()), NativeStrings(o.optJSONObject("colors") ?: JSONObject()))
    }
}
