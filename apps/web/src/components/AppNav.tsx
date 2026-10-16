'use client';

import { Link, usePathname } from '@/i18n/navigation';

export function AppNav({
  base,
  items,
  signOut,
  extra,
}: {
  base: string;
  items: Array<{ href: string; label: string }>;
  signOut: string;
  /** Links to other areas (admin, organisation portal), shown only to people who have access. */
  extra?: Array<{ href: string; label: string }>;
}) {
  const pathname = usePathname();
  return (
    <nav className="side-nav" aria-label="Account">
      {items.map((i) => {
        const href = `${base}${i.href}`;
        return (
          <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>
            {i.label}
          </Link>
        );
      })}
      {extra?.map((e) => (
        <Link key={e.href} href={e.href}>
          {e.label} →
        </Link>
      ))}
      <form action="/api/auth/signout" method="post">
        <button className="btn btn-outline btn-small" type="submit">
          {signOut}
        </button>
      </form>
    </nav>
  );
}
