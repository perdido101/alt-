package gr.alt.callshield.logic

enum class Classification(val wire: String) {
    FAMILY("family"), OFFICIAL("official"), REPORTED_SCAM("reported_scam"), RISKY("risky"), UNKNOWN("unknown")
}

enum class Reason(val wire: String) {
    FAMILY("family"), OFFICIAL("official"), REPORTED("reported"), HIDDEN("hidden"),
    INTERNATIONAL("international"), FLAGGED("flagged"), INVALID("invalid"), UNKNOWN("unknown")
}

enum class ProtectionLevel(val wire: String) {
    WARN("warn"), SILENCE("silence"), BLOCK("block");
    companion object {
        fun from(wire: String?) = entries.firstOrNull { it.wire == wire } ?: WARN
    }
}

/** What the screening service tells the system. Answering and declining always stay possible unless rejected. */
enum class CallAction(val wire: String) { ALLOW("none"), SILENCE("silenced"), REJECT("blocked") }

data class OfficialEntry(val id: String, val organisation: String, val category: String, val displayNumber: String)
data class Reputation(val approvedReports: Int, val flagged: Boolean)

data class ScreeningCache(
    val family: Set<String>,
    val official: Map<String, OfficialEntry>,
    val reputation: Map<String, Reputation>,
    val reportThreshold: Int = 3,
    val protectionLevel: ProtectionLevel = ProtectionLevel.WARN,
)

data class Decision(
    val number: NormalisedNumber,
    val classification: Classification,
    val reason: Reason,
    val official: OfficialEntry?,
    val action: CallAction,
    /** Show the warning banner/notification for this call. */
    val warn: Boolean,
    /** Offer the after-call check-in when the call ends. */
    val checkIn: Boolean,
)

/**
 * Pure decision logic, kept identical to packages/core/src/classify.ts (shared fixtures prove it).
 * Order: family > official > reported > risky > unknown.
 */
object ScreeningDecider {
    fun classify(n: NormalisedNumber, cache: ScreeningCache): Triple<Classification, Reason, OfficialEntry?> {
        val key = n.key
        if (n.kind == NumberKind.HIDDEN || key == null) return Triple(Classification.RISKY, Reason.HIDDEN, null)
        if (key in cache.family) return Triple(Classification.FAMILY, Reason.FAMILY, null)
        cache.official[key]?.let { return Triple(Classification.OFFICIAL, Reason.OFFICIAL, it) }
        val rep = cache.reputation[key]
        if (rep != null && rep.approvedReports >= cache.reportThreshold) return Triple(Classification.REPORTED_SCAM, Reason.REPORTED, null)
        if (n.kind == NumberKind.INTERNATIONAL) return Triple(Classification.RISKY, Reason.INTERNATIONAL, null)
        if (n.kind == NumberKind.INVALID) return Triple(Classification.RISKY, Reason.INVALID, null)
        if (rep?.flagged == true) return Triple(Classification.RISKY, Reason.FLAGGED, null)
        return Triple(Classification.UNKNOWN, Reason.UNKNOWN, null)
    }

    fun action(c: Classification, level: ProtectionLevel): CallAction = when (level) {
        ProtectionLevel.WARN -> CallAction.ALLOW
        ProtectionLevel.SILENCE -> if (c == Classification.REPORTED_SCAM || c == Classification.RISKY) CallAction.SILENCE else CallAction.ALLOW
        ProtectionLevel.BLOCK -> when (c) {
            Classification.REPORTED_SCAM -> CallAction.REJECT
            Classification.RISKY -> CallAction.SILENCE
            else -> CallAction.ALLOW
        }
    }

    fun decide(rawNumber: String?, cache: ScreeningCache, region: String = "GR"): Decision {
        val n = NumberNormaliser.normalise(rawNumber, region)
        val (c, reason, official) = classify(n, cache)
        val action = action(c, cache.protectionLevel)
        val notFamily = c != Classification.FAMILY
        return Decision(n, c, reason, official, action, warn = notFamily && action != CallAction.REJECT, checkIn = notFamily && action == CallAction.ALLOW)
    }
}
