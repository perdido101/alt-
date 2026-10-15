package gr.alt.callshield.logic

import gr.alt.callshield.logic.CallStateTracker.State
import kotlin.test.Test
import kotlin.test.assertEquals

class CallStateTrackerTest {
    private fun run(vararg states: State): List<Boolean> {
        val t = CallStateTracker()
        return states.map { t.onState(it) }
    }

    @Test fun `answered call ending triggers once`() =
        assertEquals(listOf(false, false, true), run(State.RINGING, State.OFFHOOK, State.IDLE))

    @Test fun `missed call does not trigger`() =
        assertEquals(listOf(false, false), run(State.RINGING, State.IDLE))

    @Test fun `outgoing call does not trigger`() =
        assertEquals(listOf(false, false), run(State.OFFHOOK, State.IDLE))

    @Test fun `repeated idle does not trigger twice`() =
        assertEquals(listOf(false, false, true, false), run(State.RINGING, State.OFFHOOK, State.IDLE, State.IDLE))

    @Test fun `survives process death via snapshot`() {
        val a = CallStateTracker()
        a.onState(State.RINGING); a.onState(State.OFFHOOK)
        val (s, answered) = a.snapshot()
        val b = CallStateTracker().apply { restore(s, answered) }
        assertEquals(true, b.onState(State.IDLE))
    }
}
