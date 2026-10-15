package gr.alt.callshield.logic

import org.json.JSONObject
import java.io.File
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ScreeningDeciderTest {
    private val fixtures = JSONObject(File(System.getProperty("fixtures")).readText())

    private fun cacheFromFixtures(level: ProtectionLevel = ProtectionLevel.WARN): ScreeningCache {
        val ctx = fixtures.getJSONObject("context")
        val family = ctx.getJSONArray("family").let { a -> (0 until a.length()).map { a.getString(it) }.toSet() }
        val officialJson = ctx.getJSONObject("official")
        val official = officialJson.keys().asSequence().associateWith { OfficialEntry(it, "Org", officialJson.getString(it), it) }
        val repJson = ctx.getJSONObject("reputation")
        val reputation = repJson.keys().asSequence().associateWith {
            val r = repJson.getJSONObject(it)
            Reputation(r.getInt("approvedReports"), r.getBoolean("flagged"))
        }
        return ScreeningCache(family, official, reputation, ctx.getInt("reportThreshold"), level)
    }

    @Test
    fun `classifies every shared fixture exactly like the TypeScript core`() {
        val cache = cacheFromFixtures()
        val cases = fixtures.getJSONArray("cases")
        for (i in 0 until cases.length()) {
            val c = cases.getJSONObject(i)
            val d = ScreeningDecider.decide(c.getString("raw"), cache)
            assertEquals(c.getString("expect"), d.classification.wire, "classification for '${c.getString("raw")}'")
            assertEquals(c.getString("reason"), d.reason.wire, "reason for '${c.getString("raw")}'")
        }
    }

    @Test
    fun `formats numbers for people`() {
        assertEquals("691 234 5678", NumberNormaliser.normalise("+306912345678").display)
        assertEquals("+44 20 7946 0958", NumberNormaliser.normalise("+442079460958").display)
        assertEquals("112", NumberNormaliser.normalise("112").display)
    }

    @Test
    fun `warn level never silences or blocks`() {
        val cache = cacheFromFixtures(ProtectionLevel.WARN)
        for (raw in listOf("6980000001", "", "+44 20 7946 0958", "6977777777")) {
            assertEquals(CallAction.ALLOW, ScreeningDecider.decide(raw, cache).action)
        }
    }

    @Test
    fun `silence level silences reported and risky calls only`() {
        val cache = cacheFromFixtures(ProtectionLevel.SILENCE)
        assertEquals(CallAction.SILENCE, ScreeningDecider.decide("6980000001", cache).action)
        assertEquals(CallAction.SILENCE, ScreeningDecider.decide("", cache).action)
        assertEquals(CallAction.ALLOW, ScreeningDecider.decide("6977777777", cache).action)
        assertEquals(CallAction.ALLOW, ScreeningDecider.decide("112", cache).action)
    }

    @Test
    fun `block level rejects reported scams, silences risky, never touches family or official`() {
        val cache = cacheFromFixtures(ProtectionLevel.BLOCK)
        assertEquals(CallAction.REJECT, ScreeningDecider.decide("6980000001", cache).action)
        assertEquals(CallAction.SILENCE, ScreeningDecider.decide("+234 803 123 4567", cache).action)
        assertEquals(CallAction.ALLOW, ScreeningDecider.decide("6912345678", cache).action)
        assertEquals(CallAction.ALLOW, ScreeningDecider.decide("210 999 9999", cache).action)
    }

    @Test
    fun `family calls get no warning and no check-in`() {
        val d = ScreeningDecider.decide("+30 691 234 5678", cacheFromFixtures())
        assertFalse(d.warn)
        assertFalse(d.checkIn)
    }

    @Test
    fun `unknown and official calls are warned and checked in afterwards`() {
        val cache = cacheFromFixtures()
        for (raw in listOf("6977777777", "112", "")) {
            val d = ScreeningDecider.decide(raw, cache)
            assertTrue(d.warn, raw)
            assertTrue(d.checkIn, raw)
        }
    }

    @Test
    fun `rejected calls show no ringing warning and need no check-in`() {
        val d = ScreeningDecider.decide("6980000001", cacheFromFixtures(ProtectionLevel.BLOCK))
        assertFalse(d.warn)
        assertFalse(d.checkIn)
    }
}
