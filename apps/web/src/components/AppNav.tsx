'use client';

import { Link, usePathname } from '@/i18n/navigation';

export function AppNav({ base, items, signOut }: { base: string; items: Array<{ href: string; label: string }>; signOut: string }) {
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
      <form action="/api/auth/signout" method="post">
        <button className="btn btn-outline btn-small" type="submit">
          {signOut}
        </button>
      </form>
    </nav>
  );
}
