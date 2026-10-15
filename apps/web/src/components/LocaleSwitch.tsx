'use client';

import { usePathname } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';

/** Switches between /el and /en on the same page. */
export function LocaleSwitch({ current, label }: { current: string; label: string }) {
  const pathname = usePathname();
  const other = current === 'el' ? 'en' : 'el';
  return (
    <Link href={pathname} locale={other} className="lang-switch" aria-label={`${label}: ${other === 'el' ? 'Ελληνικά' : 'English'}`} hrefLang={other}>
      {other === 'el' ? 'EL' : 'EN'}
    </Link>
  );
}
