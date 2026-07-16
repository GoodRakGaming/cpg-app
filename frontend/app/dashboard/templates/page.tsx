'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Template } from '@/lib/api';
import { authManager } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 10;

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authManager.isAuthenticated()) {
      router.push('/login');
      return;
    }
  }, [router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTemplates();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getTemplates({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, search });
      if (response.success && response.data?.templates) {
        setTemplates(response.data.templates);
        setTotal(response.data.pagination.total);
      } else {
        setError(response.error?.message || 'Не удалось загрузить шаблоны');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить шаблоны');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить шаблон? Это не затронет уже созданные предложения.')) return;
    try {
      await apiClient.deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  if (loading && templates.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent"></div>
        <p className="mt-4 text-muted">Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink">Шаблоны</h1>
          <p className="mt-1 text-muted">Управление шаблонами коммерческих предложений</p>
        </div>
        <Link href="/dashboard/templates/new">
          <Button variant="primary">+ Новый шаблон</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-danger">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Поиск по названию…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {templates.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mb-4 text-4xl">📄</div>
          <p className="mb-4 text-muted">
            {search ? 'Ничего не найдено' : 'У вас пока нет шаблонов'}
          </p>
          {!search && (
            <Link href="/dashboard/templates/new" className="font-medium text-accent hover:text-accent-hover">
              Создать первый шаблон
            </Link>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-line bg-surface-0">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Название</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Описание</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Версия</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Создано</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {templates.map((template) => (
                <tr key={template.id} className="transition-colors hover:bg-surface-0">
                  <td className="px-6 py-4 text-sm font-medium text-ink">{template.name}</td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {template.description || <span className="italic">—</span>}
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-muted">v{template.version}</td>
                  <td className="px-6 py-4 font-mono text-sm text-muted">
                    {new Date(template.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/templates/${template.id}`}>
                        <Button variant="secondary" className="px-3 py-1.5">Редактировать</Button>
                      </Link>
                      <Button variant="danger" className="px-3 py-1.5" onClick={() => handleDelete(template.id)}>
                        Удалить
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
