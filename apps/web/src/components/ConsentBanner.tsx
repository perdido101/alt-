'use client';

import { useEffect, useState } from 'react';

const KEY = 'alt-consent';

export function readConsent(): 'granted' | 'denied' | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

/**
 * Asks before any cookie-based analytics. Vercel Analytics is cookieless and always on; PostHog runs in
 * memory-only mode until the visitor agrees.
 */
export function ConsentBanner({ text, accept, decline, enabled }: { text: string; accept: string; decline: string; enabled: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (enabled && readConsent() === null) setOpen(true);
  }, [enabled]);
  if (!open) return null;
  const choose = (v: 'granted' | 'denied') => {
    try {
      window.localStorage.setItem(KEY, v);
    } catch {
      // Private mode: the choice lasts for this page only.
    }
    window.dispatchEvent(new CustomEvent('alt-consent', { detail: v }));
    setOpen(false);
  };
  return (
    <div className="consent" role="dialog" aria-live="polite" aria-label="Cookies">
      <p>{text}</p>
      <div className="row">
        <button className="btn btn-primary btn-small" onClick={() => choose('granted')}>
          {accept}
        </button>
        <button className="btn btn-outline btn-small" onClick={() => choose('denied')}>
          {decline}
        </button>
      </div>
    </div>
  );
}
