'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  description?: string;
}

export default function CreateProposalPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    templateId: '',
    title: '',
    status: 'draft' as const,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getTemplates();
      if (response.success && response.data?.templates) {
        setTemplates(response.data.templates);
        if (response.data.templates.length > 0) {
          setFormData((prev) => ({ ...prev, templateId: response.data!.templates[0].id }));
        }
      } else {
        setError('Ошибка загрузки шаблонов');
      }
    } catch (err) {
      setError('Не удалось загрузить шаблоны');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.templateId) {
      setError('Выберите шаблон');
      return;
    }
    if (!formData.title.trim()) {
      setError('Введите название предложения');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const response = await apiClient.createProposal({
        template_id: formData.templateId,
        title: formData.title,
        status: formData.status,
        data: {},
      });

      const dataAny = response.data as any;
      if (response.success && (dataAny?.proposal?.id || dataAny?.id)) {
        const proposalId = dataAny?.proposal?.id || dataAny?.id;
        router.push(`/dashboard/proposals/${proposalId}`);
      } else {
        setError(response.error?.message || 'Ошибка создания предложения');
      }
    } catch (err) {
      setError('Не удалось создать предложение');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка шаблонов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Создать предложение</h1>
        <Link href="/dashboard/proposals" className="text-blue-600 hover:text-blue-700">
          ← Назад
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
              Шаблон <span className="text-red-600">*</span>
            </label>
            <select
              id="template"
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              disabled={templates.length === 0}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none disabled:bg-gray-100"
            >
              <option value="">-- Выберите шаблон --</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.description ? ` — ${template.description}` : ''}
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <p className="text-sm text-yellow-600 mt-2">
                Нет доступных шаблонов.{' '}
                <Link href="/dashboard/templates/new" className="underline">
                  Создайте шаблон
                </Link>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Название предложения <span className="text-red-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Например: КП для компании Foo"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
              maxLength={255}
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Статус
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
            >
              <option value="draft">Черновик</option>
              <option value="final">Финальный</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating || templates.length === 0}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {creating ? 'Создание...' : 'Создать предложение'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
