'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Template } from '@/lib/api';
import { authManager } from '@/lib/auth';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchTemplates();
  }, [router]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTemplates();
      if (response.success && response.data?.templates) {
        setTemplates(response.data.templates);
      } else {
        setError(response.error?.message || 'Не удалось загрузить шаблоны');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить шаблоны');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить шаблон? Это не затронет уже созданные предложения.')) return;
    try {
      await apiClient.deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-gray-600 mt-4">Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Шаблоны</h1>
          <p className="text-gray-600 mt-1">Управление шаблонами коммерческих предложений</p>
        </div>
        <Link
          href="/dashboard/templates/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          + Новый шаблон
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-gray-600 mb-4">У вас пока нет шаблонов</p>
          <Link
            href="/dashboard/templates/new"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Создать первый шаблон
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Название</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Описание</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Версия</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Создано</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{template.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {template.description || <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">v{template.version}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(template.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-sm space-x-3 flex">
                    <Link
                      href={`/dashboard/templates/${template.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
