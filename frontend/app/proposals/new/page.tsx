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

  // State
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    templateId: '',
    title: '',
    description: '',
    status: 'draft' as const,
  });

  // Load templates on mount
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
        // Auto-select first template
        if (response.data.templates.length > 0) {
          setFormData((prev) => ({ ...prev, templateId: response.data.templates[0].id }));
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

    // Validation
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

      console.log('Creating proposal with:', formData);
      const response = await apiClient.createProposal({
        template_id: formData.templateId,
        title: formData.title,
        status: formData.status,
        data: {}, // Required by backend
      });

      console.log('Create response:', response);

      if (response.success && (response.data?.proposal?.id || response.data?.id)) {
        // Redirect to editor
        const proposalId = response.data?.proposal?.id || response.data?.id;
        router.push(`/proposals/${proposalId}`);
      } else {
        console.error('Create failed:', response.error?.message);
        setError(response.error?.message || 'Ошибка создания предложения');
      }
    } catch (err) {
      console.error('Create error:', err);
      setError('Не удалось создать предложение');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка шаблонов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Создать предложение</h1>
            <Link
              href="/proposals"
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              ← Назад
            </Link>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                ❌ {error}
              </div>
            )}

            {/* Template Selection */}
            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-2">
                📋 Шаблон <span className="text-red-600">*</span>
              </label>
              <select
                id="template"
                value={formData.templateId}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                disabled={templates.length === 0}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none disabled:bg-gray-100"
              >
                <option value="">-- Выберите шаблон --</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                    {template.description ? ` (${template.description})` : ''}
                  </option>
                ))}
              </select>
              {templates.length === 0 && (
                <p className="text-sm text-yellow-600 mt-2">⚠️ Нет доступных шаблонов. Создайте шаблон сначала.</p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                📝 Название предложения <span className="text-red-600">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Введите название (например, 'КП для компании Foo')"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                maxLength={255}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/255 символов</p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                📄 Описание (опционально)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Добавьте заметки или контекст для этого предложения..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/1000 символов</p>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                📌 Статус
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              >
                <option value="draft">📝 Черновик</option>
                <option value="final">✅ Финальный</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                💡 Начните с черновика, а затем отметьте как финальный
              </p>
            </div>

            {/* Template Info */}
            {formData.templateId && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  ℹ️ Предложение будет создано на основе выбранного шаблона и будет готово к редактированию
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={creating || templates.length === 0}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center justify-center gap-2"
              >
                {creating ? '⏳ Создание...' : '✨ Создать предложение'}
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

          {/* Info Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              💡 После создания вы сможете редактировать содержимое, управлять версиями и генерировать PDF
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">Нужна помощь?</p>
          <div className="flex gap-4 justify-center text-sm">
            <Link href="/templates" className="text-blue-600 hover:text-blue-700 underline">
              Управлять шаблонами
            </Link>
            <span className="text-gray-400">•</span>
            <Link href="/proposals" className="text-blue-600 hover:text-blue-700 underline">
              Мои предложения
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
