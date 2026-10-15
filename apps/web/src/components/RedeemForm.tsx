'use client';

import { useActionState } from 'react';

export function RedeemForm({
  action,
  circleId,
  labels,
}: {
  action: (prev: string | null, form: FormData) => Promise<string>;
  circleId: string;
  labels: { title: string; label: string; button: string; ok: string; invalid: string; already: string };
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="card stack">
      <h2>{labels.title}</h2>
      <input type="hidden" name="circleId" value={circleId} />
      <div className="field">
        <label htmlFor="redeem-code">{labels.label}</label>
        <input id="redeem-code" name="code" required autoCapitalize="characters" placeholder="ALT-XXXX-XXXX" />
      </div>
      {state === 'ok' ? <p className="form-ok" role="status">{labels.ok}</p> : null}
      {state === 'invalid' ? <p className="form-error" role="alert">{labels.invalid}</p> : null}
      {state === 'already' ? <p className="form-error" role="alert">{labels.already}</p> : null}
      <button className="btn btn-outline" disabled={pending}>
        {labels.button}
      </button>
    </form>
  );
}
