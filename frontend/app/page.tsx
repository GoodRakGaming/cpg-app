'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authManager } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (authManager.isAuthenticated()) {
      router.push('/dashboard/proposals');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка...</p>
      </div>
    </div>
  );
}

