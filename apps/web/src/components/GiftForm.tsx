'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';

type Option = { key: 'gift_3m' | 'gift_6m' | 'gift_12m'; label: string; price: string };
type Labels = { email: string; recipient: string; buy: string; error: string };

export function GiftForm({ options, labels, locale }: { options: Option[]; labels: Labels; locale: string }) {
  const [priceKey, setPriceKey] = useState<Option['key']>('gift_12m');
  const [email, setEmail] = useState('');
  const [recipientName, setRecipient] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    const res = await fetch('/api/billing/gift', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceKey, email: email || undefined, recipientName: recipientName || undefined, locale }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => null)) as { url?: string } | null;
    if (json?.url) {
      track('checkout_started', { plan: 'gift', interval: priceKey });
      window.location.href = json.url;
    }
    else {
      setError(true);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="stack">
      <fieldset className="radio-cards" style={{ border: 0, padding: 0, margin: 0 }}>
        {options.map((o) => (
          <label key={o.key} className="radio-card">
            <input type="radio" name="gift" value={o.key} checked={priceKey === o.key} onChange={() => setPriceKey(o.key)} />
            <strong>{o.label}</strong>
            <div className="price" style={{ fontSize: '1.6rem' }}>
              {o.price}
            </div>
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="gift-email">{labels.email}</label>
        <input id="gift-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="gift-recipient">{labels.recipient}</label>
        <input id="gift-recipient" maxLength={60} value={recipientName} onChange={(e) => setRecipient(e.target.value)} />
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {labels.error}
        </p>
      ) : null}
      <button className="btn btn-primary" disabled={busy}>
        {labels.buy}
      </button>
    </form>
  );
}
