'use client';

import { useState } from 'react';

export function DeleteAccount({ labels }: { labels: { title: string; body: string; type: string; word: string; confirm: string; done: string; error: string } }) {
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    const res = await fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: true }) }).catch(() => null);
    if (res?.ok) {
      setState('done');
      window.location.href = '/';
    } else setState('error');
  };
  if (state === 'done') return <p className="form-ok" role="status">{labels.done}</p>;
  return (
    <form onSubmit={submit} className="card stack">
      <h2>{labels.title}</h2>
      <p>{labels.body}</p>
      <div className="field">
        <label htmlFor="delete-confirm">{labels.type}</label>
        <input id="delete-confirm" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      </div>
      {state === 'error' ? <p className="form-error" role="alert">{labels.error}</p> : null}
      <button className="btn btn-outline" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger-text)' }} disabled={text.trim() !== labels.word || state === 'busy'}>
        {labels.confirm}
      </button>
    </form>
  );
}
