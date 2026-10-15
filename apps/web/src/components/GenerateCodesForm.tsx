'use client';

import { useActionState } from 'react';

export function GenerateCodesForm({ action, labels }: { action: (prev: string | null, f: FormData) => Promise<string>; labels: { title: string; count: string; generate: string; notEnough: string; error: string } }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="card stack">
      <h2>{labels.title}</h2>
      <div className="field">
        <label htmlFor="code-count">{labels.count}</label>
        <input id="code-count" name="count" type="number" min={1} max={500} defaultValue={10} required style={{ maxWidth: 160 }} />
      </div>
      {state === 'not_enough_seats' ? <p className="form-error" role="alert">{labels.notEnough}</p> : null}
      {state && !['ok', 'not_enough_seats'].includes(state) ? <p className="form-error" role="alert">{labels.error}</p> : null}
      <button className="btn btn-primary" disabled={pending}>
        {labels.generate}
      </button>
    </form>
  );
}
