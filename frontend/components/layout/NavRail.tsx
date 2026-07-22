'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthUser } from '@/lib/auth';
import { ChangePasswordModal } from './ChangePasswordModal';

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

const USERS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}>
    <path d="M17 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
    <circle cx="10" cy="7" r="3.2" />
    <path d="M19 20v-1a3.5 3.5 0 0 0-2.5-3.36" />
    <path d="M15 4.2a3.2 3.2 0 0 1 0 6" />
  </svg>
);

export function NavRail({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const isAdmin = user.role === 'admin';

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

      {isAdmin && (
        <Link
          href="/dashboard/users"
          title="Пользователи"
          className={`flex h-[34px] w-[34px] items-center justify-center rounded-control transition-colors ${
            pathname?.startsWith('/dashboard/users') ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-1 hover:text-ink'
          }`}
        >
          {USERS_ICON}
        </Link>
      )}

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
                onClick={() => {
                  setMenuOpen(false);
                  setChangePasswordOpen(true);
                }}
                className="mt-3 w-full rounded-control bg-surface-0 px-3 py-1.5 text-sm font-semibold text-ink hover:bg-line/60"
              >
                Сменить пароль
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="mt-2 w-full rounded-control bg-danger-soft px-3 py-1.5 text-sm font-semibold text-danger hover:bg-danger/15"
              >
                Выход
              </button>
            </div>
          </>
        )}
      </div>

      {changePasswordOpen && <ChangePasswordModal onClose={() => setChangePasswordOpen(false)} />}
    </div>
  );
}
