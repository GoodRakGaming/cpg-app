'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { useTemplateForm } from '@/lib/useTemplateForm';
import { TemplateFormSections } from '@/components/templates/TemplateFormSections';
import { SaveBar } from '@/components/ui/SaveBar';

export default function NewTemplatePage() {
  const router = useRouter();
  const form = useTemplateForm();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Введите название шаблона');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const data = form.buildData();
      const response = await apiClient.createTemplate(form.name.trim(), form.description.trim(), data);

      if (response.success && response.data?.template?.id) {
        router.push(`/dashboard/templates/${response.data.template.id}`);
      } else {
        setError(response.error?.message || 'Ошибка создания шаблона');
      }
    } catch (err) {
      setError('Не удалось создать шаблон');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Создать шаблон</h1>
        <Link href="/dashboard/templates" className="text-accent hover:text-accent-hover">
          ← Назад
        </Link>
      </div>

      {(error || form.uploadError) && (
        <div className="mb-4 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-danger">
          {error || form.uploadError}
        </div>
      )}

      <TemplateFormSections form={form} />

      <SaveBar
        onSave={handleSubmit}
        onCancel={() => router.back()}
        saving={creating}
        saveLabel="Создать шаблон"
        savingLabel="Создание..."
      />
    </div>
  );
}
