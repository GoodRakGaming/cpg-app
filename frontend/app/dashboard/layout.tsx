'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authManager, AuthUser } from '@/lib/auth';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard/proposals" className="flex items-center space-x-2 font-bold text-xl text-blue-600">
              <span>📝</span>
              <span>КП Генератор</span>
            </Link>

            {/* Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/dashboard/proposals"
                className="text-gray-600 hover:text-gray-900 font-medium transition"
              >
                Предложения
              </Link>
              <Link
                href="/dashboard/templates"
                className="text-gray-600 hover:text-gray-900 font-medium transition"
              >
                Шаблоны
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">{user?.first_name} {user?.last_name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
              >
                Выход
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
