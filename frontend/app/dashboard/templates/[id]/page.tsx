'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Template } from '@/lib/api';
import { useTemplateForm } from '@/lib/useTemplateForm';
import { TemplateFormSections } from '@/components/templates/TemplateFormSections';
import { SaveBar } from '@/components/ui/SaveBar';
import { Button } from '@/components/ui/Button';

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const form = useTemplateForm();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getTemplate(id);
      if (response.success && response.data?.template) {
        setTemplate(response.data.template);
        form.loadFrom(response.data.template);
      } else {
        setError('Шаблон не найден');
      }
    } catch (err) {
      setError('Не удалось загрузить шаблон');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Название не может быть пустым');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const data = form.buildData();
      const response = await apiClient.updateTemplate(id, form.name.trim(), form.description.trim(), data);

      if (response.success && response.data?.template) {
        setTemplate(response.data.template);
        setSavedAt(new Date());
      } else {
        setError(response.error?.message || 'Ошибка сохранения');
      }
    } catch (err) {
      setError('Не удалось сохранить шаблон');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить шаблон? Это не затронет уже созданные предложения.')) return;
    try {
      setDeleting(true);
      await apiClient.deleteTemplate(id);
      router.push('/dashboard/templates');
    } catch (err) {
      setError('Не удалось удалить шаблон');
      setDeleting(false);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent"></div>
          <p className="text-muted">Загрузка шаблона...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-danger">Шаблон не найден</p>
        <Link href="/dashboard/templates" className="text-accent hover:text-accent-hover">
          ← Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/templates" className="text-sm text-accent hover:text-accent-hover">
            ← К списку шаблонов
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-ink">{template.name}</h1>
          <p className="text-sm text-muted">
            Версия {template.version} · Создан {new Date(template.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <Button variant="danger" onClick={handleDelete} disabled={deleting} className="mt-6 whitespace-nowrap">
          {deleting ? 'Удаление...' : 'Удалить шаблон'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-danger">{error}</div>
      )}

      <TemplateFormSections form={form} itemsLabel="Позиции по умолчанию" />

      <SaveBar
        onSave={handleSave}
        onCancel={() => router.push('/dashboard/templates')}
        saving={saving}
        saveLabel="Сохранить"
        savingLabel="Сохранение..."
        savedAt={savedAt}
      />
    </div>
  );
}
