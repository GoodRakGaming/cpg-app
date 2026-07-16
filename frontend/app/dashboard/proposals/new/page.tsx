'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Template {
  id: string;
  name: string;
  description?: string;
}

const SELECT_CLASS =
  'w-full rounded-control border border-line bg-surface-1 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft disabled:bg-surface-0 disabled:text-muted';

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
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent"></div>
          <p className="text-muted">Загрузка шаблонов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Создать предложение</h1>
        <Link href="/dashboard/proposals" className="text-accent hover:text-accent-hover">
          ← Назад
        </Link>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          {error && (
            <div className="rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-danger">{error}</div>
          )}

          <div>
            <label htmlFor="template" className="mb-2 block text-sm font-medium text-text">
              Шаблон <span className="text-danger">*</span>
            </label>
            <select
              id="template"
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              disabled={templates.length === 0}
              className={SELECT_CLASS}
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
              <p className="mt-2 text-sm text-warning">
                Нет доступных шаблонов.{' '}
                <Link href="/dashboard/templates/new" className="underline">
                  Создайте шаблон
                </Link>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-text">
              Название предложения <span className="text-danger">*</span>
            </label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Например: КП для компании Foo"
              maxLength={255}
            />
          </div>

          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-text">
              Статус
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' })}
              className={SELECT_CLASS}
            >
              <option value="draft">Черновик</option>
              <option value="final">Финальный</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={creating || templates.length === 0} className="flex-1">
              {creating ? 'Создание...' : 'Создать предложение'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()} className="flex-1">
              Отмена
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
