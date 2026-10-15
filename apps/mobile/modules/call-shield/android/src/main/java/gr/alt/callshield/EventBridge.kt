package gr.alt.callshield

/** Forwards native events to JS while the app is running (the service and receiver have no module instance). */
object EventBridge {
    @Volatile private var sink: ((String, Map<String, Any?>) -> Unit)? = null

    fun attach(listener: (String, Map<String, Any?>) -> Unit) {
        sink = listener
    }

    fun detach() {
        sink = null
    }

    fun emit(name: String, payload: Map<String, Any?>) {
        runCatching { sink?.invoke(name, payload) }
    }
}
