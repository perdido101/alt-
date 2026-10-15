# Translation notes

Greek strings where we were unsure, or where a native reviewer should decide. Canonical Greek from the
brief is used verbatim and is not listed here.

## Grammar and gender

- **Gender of the parent.** Most parent-facing copy is in the second person and gender-neutral, but some
  isn't: "Προστατευόμενος" (role label), "Δεν είμαι σίγουρη" (milestone 4, feminine in the brief),
  "Πώς τον/τη λένε;". Proposal: store the parent's grammatical gender at invite time and use ICU `select`
  (`{gender, select, female {…} other {…}}`). Needs a decision before milestone 4.
- **"Με τη στήριξη του Δήμου {name}"** needs the municipality's name in the genitive ("Δήμου Αθηναίων",
  not "Δήμου Αθήνα"). Organisations will need a `name_el_genitive` field (milestone 6).

## Word choice

| Key | Greek | Question |
|---|---|---|
| `circle.guardian` | Φροντιστής | Chosen over "Κηδεμόνας" (legal guardianship). Alternatives: "Προστάτης", "Υπεύθυνος". |
| `circle.protected` | Προστατευόμενος | Masculine form; see gender note. |
| `join.scan` | Σκάναρε τον κωδικό | Colloquial and widely understood; "Σάρωσε" is more formal. |
| `invite.parentNameLabel` | Πώς τον/τη λένε; | The slash form is awkward for older readers; resolve with the gender proposal. |
| `setup.family.isBackup` | Γείτονας ή φίλος για ώρα ανάγκης | Check it reads naturally. |
| `relations.sibling` / `relations.friend` | Αδερφός / αδερφή, Φίλος / φίλη | Slash forms again. |
| `welcome.guardianCta` | Θέλω να προστατέψω τον γονιό μου | "τους γονείς μου" if both parents? |
| `auth.subtitle` | Θα σου στείλουμε έναν σύνδεσμο. Δεν χρειάζεται κωδικός. | "κωδικός" is also used for the one-time code; might confuse. |
| `consent.detail` | Δεν βλέπουν τα μηνύματά σου… | Legal review of the consent wording (GDPR). |

## Added in milestones 2–7

| Key | Greek | Question |
|---|---|---|
| `verdict.*Title` | Πολύ πιθανή απάτη / Πρόσεξε / Μάλλον ασφαλές | "Μάλλον ασφαλές" deliberately avoids certainty. Check it doesn't sound dismissive. |
| `verdict.askGuardian`, `alert.callNow`, `guardianAlert.callParent` | Ρώτα τον/την {name}, Πάρε τον/την {name} τώρα | Slash forms with a name. Fix with gender `select` (proposal above), or rephrase: "Ρώτα: {name}", "Τηλεφώνησε στη/στον…". |
| `call.unsure` (after-call) | Δεν είμαι σίγουρη, θα σου πω | Feminine (from the brief). Needs the gender field; masculine "σίγουρος". |
| `guardianAlert.banner` | {name} ζήτησε βοήθεια | Greek normally uses the article with names ("Η Μαρία ζήτησε…"). Needs gender too. |
| `org.sponsoredBy` | Με τη στήριξη του Δήμου {name} | `{name}` must be the genitive ("Αθηναίων", "Θεσσαλονίκης"). Today the org types it in that form; add a hint in the portal or a `name_el_genitive` field. KAPI/companies need a different phrase ("Με τη στήριξη της {name}"). |
| `parent.pin.forgot` | Ξέχασες το PIN; Ζήτα από την οικογένεια… | Check tone; "εγκαταστήσει ξανά" may be too technical for the parent. |
| `account.analytics` | Ανώνυμα στατιστικά χρήσης | Legal: is "ανώνυμα" accurate for pseudonymous install ids? Maybe "Στατιστικά χρήσης χωρίς προσωπικά στοιχεία". |
| `org.suppressedNote` | Για την προστασία των οικογενειών… | Check wording for municipal staff. |
| `callOrgArticle.*` | article agreement for organisations ("την Αστυνομία", "το ΕΚΑΒ", "τη ΔΕΗ") | Stored per official number (`article_el`); admin must fill it for new entries. |

## English

- "Guardian" for the adult child, "Protected" for the parent: product terms, may change.
