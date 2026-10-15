'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';

export function SignInForm({ labels, locale, supabaseUrl, anonKey }: { labels: { email: string; send: string; sent: string; error: string }; locale: string; supabaseUrl: string; anonKey: string }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    const supabase = createBrowserClient(supabaseUrl, anonKey);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/app`, data: { locale } },
    });
    setState(error ? 'error' : 'sent');
  };
  if (state === 'sent')
    return (
      <p className="form-ok" role="status">
        {labels.sent}
      </p>
    );
  return (
    <form onSubmit={submit} className="stack">
      <div className="field">
        <label htmlFor="signin-email">{labels.email}</label>
        <input id="signin-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
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
