'use client';

import { useState } from 'react';

type Labels = Record<'org' | 'orgType' | 'name' | 'email' | 'phone' | 'message' | 'send' | 'sent' | 'error', string> & { types: Record<string, string> };

export function B2BForm({ labels, locale }: { labels: Labels; locale: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('busy');
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, kind: 'b2b', locale }),
    }).catch(() => null);
    setState(res?.ok ? 'sent' : 'error');
  };
  if (state === 'sent')
    return (
      <p className="form-ok" role="status">
        {labels.sent}
      </p>
    );
  return (
    <form onSubmit={submit} className="stack" aria-label={labels.send}>
      <div className="field">
        <label htmlFor="b2b-org">{labels.org}</label>
        <input id="b2b-org" name="organisation" required maxLength={120} />
      </div>
      <div className="field">
        <label htmlFor="b2b-type">{labels.orgType}</label>
        <select id="b2b-type" name="orgType" defaultValue="municipality">
          {Object.entries(labels.types).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="b2b-name">{labels.name}</label>
        <input id="b2b-name" name="name" required maxLength={120} autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="b2b-email">{labels.email}</label>
        <input id="b2b-email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="b2b-phone">{labels.phone}</label>
        <input id="b2b-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" />
      </div>
      <div className="field">
        <label htmlFor="b2b-message">{labels.message}</label>
        <textarea id="b2b-message" name="message" maxLength={2000} />
      </div>
      {/* Honeypot: real people never fill this in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" />
      {state === 'error' ? (
        <p className="form-error" role="alert">
          {labels.error}
        </p>
      ) : null}
      <button className="btn btn-primary" disabled={state === 'busy'}>
        {labels.send}
      </button>
    </form>
  );
}
