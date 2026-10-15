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

## English

- "Guardian" for the adult child, "Protected" for the parent: product terms, may change.
