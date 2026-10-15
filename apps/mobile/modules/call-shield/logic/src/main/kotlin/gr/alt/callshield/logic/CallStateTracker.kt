package gr.alt.callshield.logic

/**
 * Turns the phone-state sequence into "a conversation with a screened number just ended".
 * RINGING → OFFHOOK → IDLE = answered call ended; RINGING → IDLE = missed (no check-in).
 */
class CallStateTracker {
    enum class State { IDLE, RINGING, OFFHOOK }

    private var last = State.IDLE
    private var answered = false

    /** Returns true when an answered incoming call has just ended. */
    fun onState(state: State): Boolean {
        val ended = state == State.IDLE && last != State.IDLE && answered
        when (state) {
            State.RINGING -> answered = false
            State.OFFHOOK -> if (last == State.RINGING || last == State.OFFHOOK) answered = true
            State.IDLE -> answered = false
        }
        last = state
        return ended
    }

    fun snapshot(): Pair<State, Boolean> = last to answered
    fun restore(state: State, wasAnswered: Boolean) {
        last = state
        answered = wasAnswered
    }
}
