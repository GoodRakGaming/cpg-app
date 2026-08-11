'use client';

import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, PriceCatalogEntry, PriceCatalogReferenceGroup } from '@/lib/api';
import { authManager } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 20;

const SOURCE_TYPE_LABELS: Record<string, string> = {
  own: 'своя цена',
  supplier: 'поставщик',
  competitor: 'конкурент',
  market_scan: 'мониторинг рынка',
};

const PRICE_QUALIFIER_LABELS: Record<string, string> = {
  exact: 'точная',
  from: 'от',
  approx: 'примерно',
  on_request: 'по договору',
};

function formatPrice(value: number | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('ru-RU').format(value);
}

function priceRangeLabel(g: PriceCatalogReferenceGroup): { text: string; muted: boolean } {
  if (g.source_count > 0) {
    let text =
      g.min_price === g.max_price
        ? `${formatPrice(g.min_price)} ₽ · 1 источник`
        : `${formatPrice(g.min_price)}–${formatPrice(g.max_price)} ₽ · медиана ${formatPrice(g.median_price)} ₽`;
    if (g.from_approx_count > 0) {
      text += ` (+${g.from_approx_count} «от» ${formatPrice(g.from_approx_min_price)} ₽)`;
    }
    if (g.on_request_count > 0) {
      text += ` (+${g.on_request_count} по договору)`;
    }
    return { text, muted: false };
  }

  if (g.from_approx_count > 0) {
    return {
      text: `от ${formatPrice(g.from_approx_min_price)} ₽ · ${g.from_approx_count} источн.${
        g.on_request_count > 0 ? `, ещё ${g.on_request_count} по договору` : ''
      }`,
      muted: true,
    };
  }

  if (g.on_request_count > 0) {
    return { text: `по договору · ${g.on_request_count} источн.`, muted: true };
  }

  return { text: 'нет источников', muted: true };
}

function RenameForm({
  group,
  onRenamed,
  onCancel,
}: {
  group: PriceCatalogReferenceGroup;
  onRenamed: () => void;
  onCancel: () => void;
}) {
  const [newName, setNewName] = useState(group.canonical_work_name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!newName.trim() || newName.trim() === group.canonical_work_name) {
      onCancel();
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const response = await apiClient.renameCanonicalWorkName({
        from_canonical_work_name: group.canonical_work_name,
        unit: group.unit,
        to_canonical_work_name: newName.trim(),
      });
      if (response.success) {
        onRenamed();
      } else {
        setError(response.error?.message || 'Не удалось переименовать');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось переименовать');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-control border border-line bg-surface-0 p-3">
      {error && <div className="rounded-control border border-danger/20 bg-danger-soft px-3 py-2 text-xs text-danger">{error}</div>}
      <p className="text-xs text-muted">
        Переименование объединяет все записи с текущим названием (в рамках единицы «{group.unit}») под новым —
        применяется ко всем историческим записям, не создаёт новую группу.
      </p>
      <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
      <div className="flex gap-2">
        <Button variant="secondary" className="px-3 py-1.5" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="primary" className="px-3 py-1.5" disabled={saving} onClick={handleSave}>
          {saving ? 'Сохранение...' : 'Переименовать'}
        </Button>
      </div>
    </div>
  );
}

function SourcesList({ group }: { group: PriceCatalogReferenceGroup }) {
  const [sources, setSources] = useState<PriceCatalogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiClient.getPriceCatalogSources(group.canonical_work_name, group.unit);
        if (cancelled) return;
        if (response.success && response.data?.sources) {
          setSources(response.data.sources);
        } else {
          setError(response.error?.message || 'Не удалось загрузить источники');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Не удалось загрузить источники');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.canonical_work_name, group.unit]);

  if (error) {
    return <div className="mt-2 rounded-control border border-danger/20 bg-danger-soft px-3 py-2 text-xs text-danger">{error}</div>;
  }

  if (!sources) {
    return <p className="mt-2 text-xs text-muted">Загрузка...</p>;
  }

  if (sources.length === 0) {
    return <p className="mt-2 text-xs text-muted">Источников не найдено (возможно, вышли из окна свежести в 12 месяцев).</p>;
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-control border border-line bg-surface-0 p-3">
      {sources.map((s) => (
        <div key={s.id} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 border-b border-line/60 pb-2 text-xs last:border-0 last:pb-0">
          <span className="text-ink">{s.source_work_name}</span>
          <span className="text-muted">
            {s.price_qualifier === 'on_request' ? (
              'по договору'
            ) : (
              <>
                {s.price} {s.currency}
                {s.price_qualifier !== 'exact' && <span> ({PRICE_QUALIFIER_LABELS[s.price_qualifier]})</span>}
              </>
            )}
            {' · '}
            {SOURCE_TYPE_LABELS[s.source_type]}
            {s.source_detail && <> · {s.source_detail}</>}
            {' · '}
            {new Date(s.observed_date).toLocaleDateString('ru-RU')}
          </span>
        </div>
      ))}
    </div>
  );
}

function GroupActions({
  group,
  groupKey,
  isAdmin,
  sourcesKey,
  renamingKey,
  sendingKey,
  onToggleSources,
  onToggleRename,
  onSendToReview,
}: {
  group: PriceCatalogReferenceGroup;
  groupKey: string;
  isAdmin: boolean;
  sourcesKey: string | null;
  renamingKey: string | null;
  sendingKey: string | null;
  onToggleSources: () => void;
  onToggleRename: () => void;
  onSendToReview: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" className="px-3 py-1.5" onClick={onToggleSources}>
        {sourcesKey === groupKey ? 'Скрыть источники' : 'Показать источники'}
      </Button>
      {isAdmin && (
        <>
          <Button variant="secondary" className="px-3 py-1.5" onClick={onToggleRename}>
            {renamingKey === groupKey ? 'Закрыть' : 'Переименовать'}
          </Button>
          <Button
            variant="secondary"
            className="px-3 py-1.5"
            disabled={sendingKey === groupKey}
            title="Вернуть все одобренные записи этой группы на проверку, чтобы можно было изменить"
            onClick={onSendToReview}
          >
            {sendingKey === groupKey ? 'Отправка...' : 'На пересмотр'}
          </Button>
        </>
      )}
    </div>
  );
}

export default function PriceCatalogReferencePage() {
  const router = useRouter();
  const [groups, setGroups] = useState<PriceCatalogReferenceGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [renamingKey, setRenamingKey] = useState<string | null>(null);
  const [sourcesKey, setSourcesKey] = useState<string | null>(null);
  const [sendingKey, setSendingKey] = useState<string | null>(null);

  const currentUser = authManager.getUser();
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!authManager.isAuthenticated()) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchGroups();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPriceCatalogReference({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, search });
      if (response.success && response.data?.groups) {
        setGroups(response.data.groups);
        setTotal(response.data.pagination.total);
      } else {
        setError(response.error?.message || 'Не удалось загрузить справочник');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить справочник');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const groupKey = (g: PriceCatalogReferenceGroup) => `${g.canonical_work_name}::${g.unit}`;

  const handleSendToReview = async (g: PriceCatalogReferenceGroup) => {
    const key = groupKey(g);
    if (!confirm(`Вернуть «${g.canonical_work_name}» (${g.unit}) на пересмотр? Запись пропадёт из справочника, пока её не одобрят заново.`)) {
      return;
    }
    setError('');
    setSendingKey(key);
    try {
      const response = await apiClient.sendGroupToReview(g.canonical_work_name, g.unit);
      if (response.success) {
        fetchGroups();
      } else {
        setError(response.error?.message || 'Не удалось отправить на пересмотр');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить на пересмотр');
    } finally {
      setSendingKey(null);
    }
  };

  if (loading && groups.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent"></div>
        <p className="mt-4 text-muted">Загрузка...</p>
      </div>
    );
  }

  const colSpan = isAdmin ? 6 : 5;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink">Справочник цен</h1>
        <p className="mt-1 text-muted">Уже одобренные записи каталога, сгруппированные по работе и единице измерения.</p>
      </div>

      {error && <div className="mb-6 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-danger">{error}</div>}

      <div className="mb-4">
        <Input placeholder="Поиск по названию работы…" value={search} onChange={(e) => handleSearchChange(e.target.value)} className="max-w-xs" />
      </div>

      {groups.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mb-4 text-4xl">📖</div>
          <p className="text-muted">{search ? 'Ничего не найдено' : 'В справочнике пока пусто — каталог наполняется по мере проверки записей'}</p>
        </Card>
      ) : (
        <>
          {/* Десктоп/планшет — таблица */}
          <Card className="hidden overflow-hidden md:block">
            <table className="w-full">
              <thead className="border-b border-line bg-surface-0">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text">Работа</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text">Категория</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text">Ед. изм.</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text">Диапазон цены</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {groups.map((g) => {
                  const key = groupKey(g);
                  const range = priceRangeLabel(g);
                  return (
                    <Fragment key={key}>
                      <tr className="transition-colors hover:bg-surface-0">
                        <td className="px-6 py-4 text-sm font-medium text-ink">{g.canonical_work_name}</td>
                        <td className="px-6 py-4 text-sm text-muted">{g.category || '—'}</td>
                        <td className="px-6 py-4 text-sm text-muted">{g.unit}</td>
                        <td className={`px-6 py-4 text-sm ${range.muted ? 'text-muted' : 'text-ink'}`}>{range.text}</td>
                        <td className="px-6 py-4 text-sm">
                          <GroupActions
                            group={g}
                            groupKey={key}
                            isAdmin={isAdmin}
                            sourcesKey={sourcesKey}
                            renamingKey={renamingKey}
                            sendingKey={sendingKey}
                            onToggleSources={() => setSourcesKey(sourcesKey === key ? null : key)}
                            onToggleRename={() => setRenamingKey(renamingKey === key ? null : key)}
                            onSendToReview={() => handleSendToReview(g)}
                          />
                        </td>
                      </tr>
                      {sourcesKey === key && (
                        <tr>
                          <td colSpan={colSpan} className="px-6 pb-4">
                            <SourcesList group={g} />
                          </td>
                        </tr>
                      )}
                      {renamingKey === key && (
                        <tr>
                          <td colSpan={colSpan} className="px-6 pb-4">
                            <RenameForm
                              group={g}
                              onCancel={() => setRenamingKey(null)}
                              onRenamed={() => {
                                setRenamingKey(null);
                                fetchGroups();
                              }}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* Мобильный экран — карточки, как в «Проверке цен», вместо таблицы */}
          <div className="flex flex-col gap-3 md:hidden">
            {groups.map((g) => {
              const key = groupKey(g);
              const range = priceRangeLabel(g);
              return (
                <Card key={key} className="p-4">
                  <p className="text-sm font-semibold text-ink">{g.canonical_work_name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {g.category || 'без категории'} · {g.unit}
                  </p>
                  <p className={`mt-1 text-sm ${range.muted ? 'text-muted' : 'text-ink'}`}>{range.text}</p>
                  <div className="mt-3">
                    <GroupActions
                      group={g}
                      groupKey={key}
                      isAdmin={isAdmin}
                      sourcesKey={sourcesKey}
                      renamingKey={renamingKey}
                      sendingKey={sendingKey}
                      onToggleSources={() => setSourcesKey(sourcesKey === key ? null : key)}
                      onToggleRename={() => setRenamingKey(renamingKey === key ? null : key)}
                      onSendToReview={() => handleSendToReview(g)}
                    />
                  </div>
                  {sourcesKey === key && <SourcesList group={g} />}
                  {renamingKey === key && (
                    <RenameForm
                      group={g}
                      onCancel={() => setRenamingKey(null)}
                      onRenamed={() => {
                        setRenamingKey(null);
                        fetchGroups();
                      }}
                    />
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
