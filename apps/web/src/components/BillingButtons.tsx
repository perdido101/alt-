'use client';

import { useState } from 'react';
import { track } from '@/lib/analytics';

async function go(path: string, body: Record<string, string>) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = (await res.json().catch(() => ({}))) as { url?: string };
  if (json.url) {
    track('checkout_started', { plan: body.plan ?? body.priceKey ?? 'unknown' });
    window.location.href = json.url;
  }
  return !!json.url;
}

/** Checkout / Customer Portal buttons (Stripe-hosted pages). */
export function BillingButtons({
  circleId,
  locale,
  options,
  portalLabel,
  showPortal,
  errorLabel,
  autoPlan,
}: {
  circleId: string;
  locale: string;
  options: Array<{ key: string; label: string }>;
  portalLabel: string;
  showPortal: boolean;
  errorLabel: string;
  autoPlan?: string;
}) {
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, path: string, body: Record<string, string>) => {
    setBusy(key);
    setError(false);
    if (!(await go(path, body))) {
      setError(true);
      setBusy(null);
    }
  };
  return (
    <div className="stack">
      <div className="row">
        {options.map((o) => (
          <button key={o.key} className={`btn ${o.key === autoPlan ? 'btn-primary' : 'btn-outline'}`} disabled={!!busy} onClick={() => void run(o.key, '/api/billing/checkout', { circleId, priceKey: o.key, locale })}>
            {o.label}
          </button>
        ))}
        {showPortal ? (
          <button className="btn btn-outline" disabled={!!busy} onClick={() => void run('portal', '/api/billing/portal', { circleId, locale })}>
            {portalLabel}
          </button>
        ) : null}
      </div>
      {error ? <p className="form-error" role="alert">{errorLabel}</p> : null}
    </div>
  );
}
