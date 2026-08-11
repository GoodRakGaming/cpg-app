'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Proposal } from '@/lib/api';
import { authManager } from '@/lib/auth';
import { usePolling } from '@/lib/usePolling';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Badge, BadgeStatus } from '@/components/ui/Badge';
import { FilterChips } from '@/components/ui/FilterChips';

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<BadgeStatus, string> = {
  draft: 'Черновик',
  final: 'Финальный',
  archived: 'Архив',
};

const STATUS_FILTERS: { value: BadgeStatus | ''; label: string }[] = [
  { value: '', label: 'Все' },
  { value: 'draft', label: 'Черновики' },
  { value: 'final', label: 'Финальные' },
  { value: 'archived', label: 'Архив' },
];

function proposalTotal(proposal: Proposal): number {
  return (proposal.data?.items || []).reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + quantity * price;
  }, 0);
}

export default function ProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BadgeStatus | ''>('');
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
      fetchProposals();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status]);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getProposals({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        search,
        status: status || undefined,
      });
      if (response.success && response.data?.proposals) {
        setProposals(response.data.proposals);
        setTotal(response.data.pagination.total);
      } else {
        setError(response.error?.message || 'Не удалось загрузить предложения');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить предложения');
    } finally {
      setLoading(false);
    }
  };

  // Список общий на всех сотрудников — новые/чужие КП должны появляться без ручной перезагрузки.
  usePolling(fetchProposals, 15000);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleStatusChange = (value: BadgeStatus | '') => {
    setStatus(value);
    setPage(0);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить предложение?')) return;
    try {
      await apiClient.deleteProposal(id);
      setProposals(proposals.filter((p) => p.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления');
    }
  };

  if (loading && proposals.length === 0) {
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
          <h1 className="text-3xl font-bold text-ink">Предложения</h1>
          <p className="mt-1 text-muted">Управление коммерческими предложениями</p>
        </div>
        <Link href="/dashboard/proposals/new">
          <Button variant="primary">+ Новое предложение</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-danger">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Поиск по названию…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
        <FilterChips options={STATUS_FILTERS} value={status} onChange={handleStatusChange} />
      </div>

      {proposals.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mb-4 text-4xl">📋</div>
          <p className="mb-4 text-muted">
            {search || status ? 'Ничего не найдено' : 'У вас пока нет предложений'}
          </p>
          {!search && !status && (
            <Link href="/dashboard/proposals/new" className="font-medium text-accent hover:text-accent-hover">
              Создать первое предложение
            </Link>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-line bg-surface-0">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Название</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Статус</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Сумма</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Создано</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-text">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {proposals.map((proposal) => (
                <tr key={proposal.id} className="transition-colors hover:bg-surface-0">
                  <td className="px-6 py-4 text-sm font-medium text-ink">{proposal.title}</td>
                  <td className="px-6 py-4 text-sm">
                    <Badge status={proposal.status}>{STATUS_LABEL[proposal.status]}</Badge>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-text">
                    {proposalTotal(proposal).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-muted">
                    {new Date(proposal.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <Link href={`/dashboard/proposals/${proposal.id}`}>
                        <Button variant="secondary" className="px-3 py-1.5">Редактировать</Button>
                      </Link>
                      <Button variant="danger" className="px-3 py-1.5" onClick={() => handleDelete(proposal.id)}>
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
