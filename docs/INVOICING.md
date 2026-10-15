# Invoicing organisations (myDATA)

Municipalities, KAPI and companies buy licence seats and pay by bank transfer against an invoice (§11).

- Greek B2B/B2G invoices must be issued through a **myDATA-certified provider** that returns the MARK.
  Public bodies may also require e-invoices through the KED / Peppol route; ask the provider.
- The code has an `InvoicingProvider` interface (`apps/web/src/server/invoicing/provider.ts`):
  - `ManualInvoicing` (default, `INVOICING_PROVIDER=manual`): validates the ΑΦΜ, records the request
    in `audit_log` (`invoice.requested`, with net/VAT/gross), and the admin issues the invoice in the
    provider's UI.
  - `MyDataProvider`: placeholder that throws until a provider is chosen. Implement `issue()` with the
    provider's API (create invoice → MARK → PDF URL) and switch `INVOICING_PROVIDER=mydata`.
- VAT: 24 % standard. Prices in `packages/core/src/plans.ts` are VAT-inclusive for consumers; org prices
  are quoted net.
- Seats are added by an admin in **Admin → Οργανισμοί** once the order (or the public body's
  commitment decision, ΑΔΑ) is received; payment is not a prerequisite for public bodies.

To do once a provider is chosen: buyer details on the organisation record (ΑΦΜ, ΔΟΥ, address), an admin
button "Έκδοση τιμολογίου", and emailing the PDF to the org contact.
