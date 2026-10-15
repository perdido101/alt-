'use client';

import { useState } from 'react';

type Labels = { share: string; viber: string; whatsapp: string; facebook: string; copy: string; copied: string };

/** Share a Scam Radar item to Viber, WhatsApp or Facebook (no tracking scripts, plain links). */
export function ShareButtons({ url, title, labels }: { url: string; title: string; labels: Labels }) {
  const [copied, setCopied] = useState(false);
  const text = `${title} ${url}`;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <strong>{labels.share}</strong>
      <div className="share">
        <a className="btn btn-outline btn-small" href={`viber://forward?text=${encodeURIComponent(text)}`}>
          {labels.viber}
        </a>
        <a className="btn btn-outline btn-small" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
          {labels.whatsapp}
        </a>
        <a className="btn btn-outline btn-small" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
          {labels.facebook}
        </a>
        <button
          type="button"
          className="btn btn-outline btn-small"
          onClick={() => {
            void navigator.clipboard?.writeText(url).then(() => setCopied(true));
          }}
          aria-live="polite"
        >
          {copied ? labels.copied : labels.copy}
        </button>
      </div>
    </div>
  );
}
