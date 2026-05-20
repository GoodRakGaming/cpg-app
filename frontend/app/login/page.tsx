'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { authManager } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Начинаю логин с:', email);
      const response = await apiClient.login(email, password);
      console.log('✅ API ответил:', response);

      if (!response.success) {
        console.error('❌ Login failed:', response.error?.message);
        setError(response.error?.message || 'Login failed');
        return;
      }

      // Save user data
      if (response.data?.user) {
        console.log('💾 Сохраняю user:', response.data.user);
        authManager.setUser(response.data.user);
      }

      // Save tokens (access_token is returned, refresh_token is in httpOnly cookie)
      if (response.data?.access_token) {
        console.log('💾 Сохраняю access_token');
        // Note: refresh_token is automatically stored in httpOnly cookie by backend
        // We only need to store access_token for client-side use
        authManager.setTokens(response.data.access_token, '');
        
        // Debug: Check what got stored
        console.log('✅ Login successful! Tokens saved.');
        console.log('Access Token:', authManager.getAccessToken() ? '✅ Saved' : '❌ Not saved');
        console.log('User:', authManager.getUser());
      }

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🚀 Перенаправляю на /proposals...');
      router.push('/proposals');
      console.log('✅ router.push() выполнен!');
    } catch (err) {
      console.error('❌ Catch ошибка:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          📝 КП Генератор
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Коммерческие предложения за минуты
        </p>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Зарегистрироваться
            </Link>
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            <strong>Демо:</strong> test@example.com / Test123!
          </p>
        </div>
      </div>
    </div>
  );
}
