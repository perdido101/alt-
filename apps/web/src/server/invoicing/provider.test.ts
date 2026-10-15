import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { ManualInvoicing, MyDataProvider, invoiceTotals } = await import('./provider');

describe('invoicing', () => {
  it('computes Greek VAT totals', () => {
    expect(invoiceTotals([{ description: 'Άδειες ΑΛΤ!', quantity: 100, unitPriceCents: 2400, vatRate: 0.24 }])).toEqual({ netCents: 240000, vatCents: 57600, grossCents: 297600 });
  });
  it('manual provider validates ΑΦΜ and records the request', async () => {
    const p = new ManualInvoicing(async () => 'ref-1');
    const base = { organisationId: 'o', buyerName: 'Δήμος', buyerAddress: 'Αθήνα', lines: [], currency: 'EUR' as const };
    await expect(p.issue({ ...base, buyerVat: '123' })).rejects.toThrow('invalid_vat');
    await expect(p.issue({ ...base, buyerVat: '090153025' })).resolves.toEqual({ status: 'pending_manual', reference: 'ref-1' });
  });
  it('myDATA placeholder refuses until configured', async () => {
    await expect(new MyDataProvider().issue()).rejects.toThrow('mydata_provider_not_configured');
  });
});
