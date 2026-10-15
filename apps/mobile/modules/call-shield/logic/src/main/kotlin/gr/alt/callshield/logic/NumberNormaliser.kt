package gr.alt.callshield.logic

import com.google.i18n.phonenumbers.NumberParseException
import com.google.i18n.phonenumbers.PhoneNumberUtil

enum class NumberKind { HIDDEN, SHORT, DOMESTIC, INTERNATIONAL, INVALID }

/** Mirrors packages/core/src/phone.ts. `key` is E.164 for full numbers, digits for short codes, null when hidden. */
data class NormalisedNumber(val kind: NumberKind, val key: String?, val display: String? = key)

object NumberNormaliser {
    private val util: PhoneNumberUtil = PhoneNumberUtil.getInstance()
    private val hiddenMarkers = setOf("", "private", "anonymous", "unknown", "restricted", "withheld", "-1", "-2", "-3")
    private val shortCode = Regex("^1\\d{2,4}$")

    fun normalise(raw: String?, region: String = "GR"): NormalisedNumber {
        val trimmed = raw?.trim() ?: ""
        if (trimmed.lowercase() in hiddenMarkers) return NormalisedNumber(NumberKind.HIDDEN, null)
        val digits = trimmed.replace(Regex("[^\\d+]"), "")
        if (region == "GR" && shortCode.matches(digits)) return NormalisedNumber(NumberKind.SHORT, digits)
        return try {
            val parsed = util.parse(trimmed, region)
            if (!util.isValidNumber(parsed)) invalid(digits)
            else {
                val e164 = util.format(parsed, PhoneNumberUtil.PhoneNumberFormat.E164)
                val country = util.getRegionCodeForNumber(parsed)
                val domestic = country == region
                val display = util.format(parsed, if (domestic) PhoneNumberUtil.PhoneNumberFormat.NATIONAL else PhoneNumberUtil.PhoneNumberFormat.INTERNATIONAL)
                NormalisedNumber(if (domestic) NumberKind.DOMESTIC else NumberKind.INTERNATIONAL, e164, display)
            }
        } catch (e: NumberParseException) {
            invalid(digits)
        }
    }

    private fun invalid(digits: String): NormalisedNumber {
        val key = if (digits.isEmpty()) null else digits.first() + digits.drop(1).replace("+", "")
        return NormalisedNumber(NumberKind.INVALID, key)
    }
}
