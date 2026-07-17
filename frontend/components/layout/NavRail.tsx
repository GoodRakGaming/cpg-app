'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthUser } from '@/lib/auth';

const NAV_ITEMS = [
  {
    href: '/dashboard/proposals',
    label: 'Предложения',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" width={18} height={18}>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M9 9h6M9 12.5h6M9 16h4" />
      </svg>
    ),
  },
  {
    href: '/dashboard/templates',
    label: 'Шаблоны',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
];

function initials(user: AuthUser): string {
  const first = user.first_name?.[0] || '';
  const last = user.last_name?.[0] || '';
  return (first + last).toUpperCase() || user.email[0].toUpperCase();
}

export function NavRail({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="group/rail sticky top-0 flex h-screen w-14 flex-shrink-0 flex-col items-center gap-2.5 overflow-y-auto bg-surface-0 py-4 transition-colors hover:bg-line/60">
      <Link
        href="/dashboard/proposals"
        title="КП Генератор"
        className="mb-3 flex h-[26px] w-[26px] items-center justify-center rounded-control bg-accent text-xs font-extrabold text-white"
      >
        К
      </Link>

      {NAV_ITEMS.map((item) => {
        const active = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={`flex h-[34px] w-[34px] items-center justify-center rounded-control transition-colors ${
              active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-1 hover:text-ink'
            }`}
          >
            {item.icon}
          </Link>
        );
      })}

      <div className="relative mt-auto">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          title={user.email}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-[10.5px] font-bold text-white"
        >
          {initials(user)}
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute bottom-0 left-full z-20 ml-2 w-56 rounded-card border border-line bg-surface-1 p-3 shadow-card">
              <p className="truncate text-sm font-medium text-ink">{user.email}</p>
              {(user.first_name || user.last_name) && (
                <p className="truncate text-xs text-muted">
                  {user.first_name} {user.last_name}
                </p>
              )}
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 w-full rounded-control bg-danger-soft px-3 py-1.5 text-sm font-semibold text-danger hover:bg-danger/15"
              >
                Выход
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
