import 'server-only';

/**
 * Invoicing for organisations (§11: municipalities and companies pay by invoice, not card).
 *
 * Greek law requires every B2B invoice to be transmitted to AADE's myDATA. We do not talk to myDATA
 * directly: a certified e-invoicing provider (e.g. Epsilon Smart, Prosvasis, SoftOne, Elorus) issues the
 * invoice, gets the MARK (Μοναδικός Αριθμός Καταχώρισης) and sends the PDF. Pick the provider and
 * implement `MyDataProvider` below; until then `ManualInvoicing` records the request for the admin.
 * See docs/INVOICING.md.
 */
export type InvoiceLine = { description: string; quantity: number; unitPriceCents: number; vatRate: 0.24 | 0.13 | 0.06 | 0 };

export type InvoiceRequest = {
  organisationId: string;
  /** Buyer tax number (ΑΦΜ) and tax office (ΔΟΥ): required for Greek B2B/B2G invoices. */
  buyerVat: string;
  buyerTaxOffice?: string;
  buyerName: string;
  buyerAddress: string;
  /** Public bodies: the ΑΔΑ / commitment reference from the purchase decision, if they give one. */
  publicSectorRef?: string;
  lines: InvoiceLine[];
  currency: 'EUR';
};

export type IssuedInvoice = { status: 'issued'; number: string; mark: string; pdfUrl: string } | { status: 'pending_manual'; reference: string };

export interface InvoicingProvider {
  readonly name: string;
  issue(req: InvoiceRequest): Promise<IssuedInvoice>;
}

export function invoiceTotals(lines: InvoiceLine[]) {
  const net = lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0);
  const vat = lines.reduce((s, l) => s + Math.round(l.quantity * l.unitPriceCents * l.vatRate), 0);
  return { netCents: net, vatCents: vat, grossCents: net + vat };
}

/** Default: no automatic invoice. Stores the request in audit_log; the admin issues it in the provider's UI. */
export class ManualInvoicing implements InvoicingProvider {
  readonly name = 'manual';
  constructor(private readonly record: (req: InvoiceRequest) => Promise<string>) {}
  async issue(req: InvoiceRequest): Promise<IssuedInvoice> {
    if (!/^\d{9}$/.test(req.buyerVat)) throw new Error('invalid_vat');
    return { status: 'pending_manual', reference: await this.record(req) };
  }
}

/** Placeholder for the chosen myDATA-certified provider. Fails loudly so it is never used by accident. */
export class MyDataProvider implements InvoicingProvider {
  readonly name = 'mydata';
  async issue(): Promise<IssuedInvoice> {
    throw new Error('mydata_provider_not_configured');
  }
}

export async function invoicingProvider(): Promise<InvoicingProvider> {
  if (process.env.INVOICING_PROVIDER === 'mydata') return new MyDataProvider();
  const { supabaseAdmin } = await import('../supabase');
  return new ManualInvoicing(async (req) => {
    const db = supabaseAdmin();
    const { data } = await db
      .from('audit_log')
      .insert({ actor_id: null, action: 'invoice.requested', entity: 'organisation', entity_id: req.organisationId, meta: { ...req, totals: invoiceTotals(req.lines) } })
      .select('id')
      .single();
    return String((data as { id: string | number } | null)?.id ?? 'unknown');
  });
}
