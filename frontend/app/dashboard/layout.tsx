'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authManager, AuthUser } from '@/lib/auth';
import { NavRail } from '@/components/layout/NavRail';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authManager.getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    setUser(currentUser);
    setLoading(false);

    // Subscribe to auth changes
    const unsubscribe = authManager.subscribe((newUser) => {
      setUser(newUser);
      if (!newUser) {
        router.push('/login');
      }
    });

    return unsubscribe;
  }, [router]);

  const handleLogout = async () => {
    await authManager.logout();
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-0">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent"></div>
          <p className="text-muted">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-0">
      <NavRail user={user} onLogout={handleLogout} />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
