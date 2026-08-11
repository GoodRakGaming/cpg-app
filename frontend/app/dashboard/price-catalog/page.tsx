'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, PriceCatalogEntry, PriceCatalogStatus } from '@/lib/api';
import { authManager } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';

const PAGE_SIZE = 20;

const PRICE_QUALIFIER_LABELS: Record<string, string> = {
  exact: 'точная',
  from: 'от',
  approx: 'примерно',
  on_request: 'по договору',
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  own: 'своя цена',
  supplier: 'поставщик',
  competitor: 'конкурент',
  market_scan: 'мониторинг рынка',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  low: 'низкая',
  medium: 'средняя',
  high: 'высокая',
};

const STATUS_TABS: { value: PriceCatalogStatus | 'all'; label: string }[] = [
  { value: 'pending_review', label: 'На проверке' },
  { value: 'approved', label: 'Одобрено' },
  { value: 'rejected', label: 'Отклонено' },
  { value: 'all', label: 'Все' },
];

// Временная шпаргалка для проверяющих, пока интерфейс новый — можно убрать, когда привыкнут.
function LegendModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <Card className="max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Что есть что в карточке</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink">
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-3 text-sm text-ink">
          <div>
            <p className="font-semibold">«Исходное: …»</p>
            <p className="text-muted">Название работы ровно как в документе-источнике. Не редактируется — для сверки с оригиналом.</p>
          </div>
          <div>
            <p className="font-semibold">Жирная строка ниже</p>
            <p className="text-muted">
              Каноническое название — под ним запись попадёт в статистику цены (в скобках категория и единица
              измерения). Пока библиотекарь (LLM) не подключён, оно совпадает с исходным.
            </p>
          </div>
          <div>
            <p className="font-semibold">Цена и источник</p>
            <p className="text-muted">
              Число + валюта — цена. В скобках — тип цены, если не обычная: «от», «примерно» или «по договору»
              (тогда числа нет). Дальше через « · » — тип источника (своя цена / поставщик / конкурент) и его
              описание.
            </p>
          </div>
          <div>
            <p className="font-semibold">Серые плашки</p>
            <p className="text-muted">
              «Уверенность извлечения» — насколько LLM была уверена в самих цифрах (плохой скан, нечёткая
              формулировка). «Похоже на существующее» — библиотекарь подозревает дубль другой категории/названия.
              Дата — дата документа-источника, не дата загрузки.
            </p>
          </div>
          <div>
            <p className="font-semibold">Кнопки</p>
            <p className="text-muted">
              «Изменить» — открыть форму правки полей перед решением. «Отклонить» — пометить как мусор/ошибку, в
              статистику не попадёт. «Одобрить» — запись уходит в «Справочник» и начинает участвовать в подсказке
              цены.
            </p>
          </div>
          <div>
            <p className="font-semibold">После решения</p>
            <p className="text-muted">
              Одобренная/отклонённая запись пропадёт из вкладки «На проверке» — искать её в «Одобрено»/«Отклонено»
              наверху.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function EditForm({ entry, onSaved, onCancel }: { entry: PriceCatalogEntry; onSaved: (e: PriceCatalogEntry) => void; onCancel: () => void }) {
  const [canonicalWorkName, setCanonicalWorkName] = useState(entry.canonical_work_name);
  const [category, setCategory] = useState(entry.category || '');
  const [unit, setUnit] = useState(entry.unit);
  const [price, setPrice] = useState(entry.price != null ? String(entry.price) : '');
  const [priceQualifier, setPriceQualifier] = useState(entry.price_qualifier);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const response = await apiClient.updatePriceCatalogEntry(entry.id, {
        canonical_work_name: canonicalWorkName,
        category: category || null,
        unit,
        price: priceQualifier === 'on_request' ? null : parseFloat(price),
        price_qualifier: priceQualifier,
      });
      if (response.success && response.data?.price_catalog) {
        onSaved(response.data.price_catalog);
      } else {
        setError(response.error?.message || 'Не удалось сохранить изменения');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-control border border-line bg-surface-0 p-3">
      {error && <div className="rounded-control border border-danger/20 bg-danger-soft px-3 py-2 text-xs text-danger">{error}</div>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-muted">Каноническое название</label>
          <Input value={canonicalWorkName} onChange={(e) => setCanonicalWorkName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Категория</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted">Единица измерения</label>
          <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted">Цена</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={priceQualifier === 'on_request'}
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-muted">Тип</label>
            <select
              value={priceQualifier}
              onChange={(e) => setPriceQualifier(e.target.value as PriceCatalogEntry['price_qualifier'])}
              className="w-full rounded-control border border-line bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft"
            >
              {Object.entries(PRICE_QUALIFIER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="mt-1 flex gap-2">
        <Button variant="secondary" className="px-3 py-1.5" onClick={onCancel}>
          Отмена
        </Button>
        <Button variant="primary" className="px-3 py-1.5" disabled={saving} onClick={handleSave}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );
}

function SimilarityPanel({ entry }: { entry: PriceCatalogEntry }) {
  const details = entry.category_review_details;
  const matches = details
    ? (['category', 'canonical_work_name'] as const)
        .map((key) => (details[key] ? { field: key, ...details[key]! } : null))
        .filter((m): m is { field: 'category' | 'canonical_work_name'; value: string; similarity: number } => m !== null)
    : [];
  const priceConflict = details?.price_conflict;

  if (matches.length === 0 && !priceConflict) {
    return (
      <div className="mt-2 rounded-control border border-line bg-surface-0 p-3 text-xs">
        <p className="text-muted">Библиотекарь не сохранил, на что именно похоже (запись создана до этой доработки).</p>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-control border border-line bg-surface-0 p-3 text-xs">
      <div className="flex flex-col gap-1.5">
        {matches.map((m) => (
          <p key={m.field}>
            <span className="text-muted">{m.field === 'category' ? 'Категория похожа на' : 'Название похоже на'}:</span>{' '}
            <span className="font-medium text-ink">{m.value}</span>{' '}
            <span className="text-muted">({Math.round(m.similarity * 100)}%)</span>
          </p>
        ))}
        {priceConflict && (
          <p>
            <span className="text-muted">Библиотекарь посчитал это той же работой, но цена расходится:</span>{' '}
            <span className="font-medium text-ink">
              {priceConflict.source_price} ₽ источника
            </span>{' '}
            <span className="text-muted">
              vs {priceConflict.existing_min === priceConflict.existing_max
                ? `${priceConflict.existing_min} ₽`
                : `${priceConflict.existing_min}–${priceConflict.existing_max} ₽`}{' '}
              в базе (+{priceConflict.delta_percent}%) — возможно, это другая по объёму/сложности работа.
            </span>
          </p>
        )}
        <p className="mt-1 text-muted">
          Если это та же работа/категория — впиши точно такое же название в форме «Изменить» перед одобрением.
        </p>
      </div>
    </div>
  );
}

const DATE_SOURCE_LABELS: Record<string, string> = {
  extracted: 'дата взята из самого документа',
  upload_fallback: 'точная дата в документе не найдена — использована дата загрузки файла',
};

// Известные технические ключи raw_extraction — показываем с понятной подписью, а не как есть.
// date_source вынесен отдельно (см. ниже, рядом с датой документа), сюда не попадает.
const RAW_EXTRACTION_LABELS: Record<string, string> = {
  snippet: 'Фрагмент текста источника',
  ocr_note: 'Заметка распознавания (OCR)',
};

function SourcePanel({ entry }: { entry: PriceCatalogEntry }) {
  const rawEntries = entry.raw_extraction ? Object.entries(entry.raw_extraction).filter(([k]) => k !== 'date_source') : [];
  const dateSource = entry.raw_extraction?.date_source as string | undefined;

  return (
    <div className="mt-2 rounded-control border border-line bg-surface-0 p-3 text-xs">
      <p className="font-medium text-ink">
        Где искать: {entry.source_detail || <span className="italic text-muted">описание источника не указано</span>}
      </p>
      <p className="mt-0.5 text-muted">Тип источника: {SOURCE_TYPE_LABELS[entry.source_type]}</p>

      <div className="mt-2 flex flex-col gap-1 border-t border-line/60 pt-2">
        <p>
          <span className="text-muted">Дата документа:</span>{' '}
          <span className="text-ink">{new Date(entry.observed_date).toLocaleDateString('ru-RU')}</span>
          {dateSource && <span className="text-muted"> — {DATE_SOURCE_LABELS[dateSource] || dateSource}</span>}
        </p>
        {entry.model && (
          <p>
            <span className="text-muted">Модель извлечения:</span> <span className="text-ink">{entry.model}</span>
          </p>
        )}
      </div>

      {rawEntries.length > 0 && (
        <div className="mt-2 border-t border-line/60 pt-2">
          <div className="flex flex-col gap-1">
            {rawEntries.map(([k, v]) => (
              <p key={k}>
                <span className="text-muted">{RAW_EXTRACTION_LABELS[k] || k}:</span>{' '}
                <span className="text-ink">{typeof v === 'string' ? v : JSON.stringify(v)}</span>
              </p>
            ))}
          </div>
        </div>
      )}
      <p className="mt-2 text-muted">
        Используй эти данные, чтобы найти исходный документ и сверить извлечённое значение вручную.
      </p>
    </div>
  );
}

export default function PriceCatalogPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<PriceCatalogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PriceCatalogStatus | 'all'>('pending_review');
  const [flagOnly, setFlagOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [similarityOpenId, setSimilarityOpenId] = useState<string | null>(null);
  const [sourceOpenId, setSourceOpenId] = useState<string | null>(null);

  const isAdmin = authManager.getUser()?.role === 'admin';

  useEffect(() => {
    if (!authManager.isAuthenticated()) {
      router.push('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEntries();
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, flagOnly]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getPriceCatalog({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        search,
        status,
        category_review_flag: flagOnly,
      });
      if (response.success && response.data?.price_catalog) {
        setEntries(response.data.price_catalog);
        setTotal(response.data.pagination.total);
      } else {
        setError(response.error?.message || 'Не удалось загрузить каталог');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить каталог');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleStatusChange = (value: PriceCatalogStatus | 'all') => {
    setStatus(value);
    setPage(0);
  };

  const applyStatus = async (id: string, newStatus: PriceCatalogStatus) => {
    setError('');
    try {
      const response = await apiClient.updatePriceCatalogEntry(id, { status: newStatus });
      if (response.success) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        setTotal((t) => Math.max(0, t - 1));
      } else {
        setError(response.error?.message || 'Не удалось обновить статус');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить статус');
    }
  };

  if (loading && entries.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent"></div>
        <p className="mt-4 text-muted">Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Проверка цен</h1>
          <p className="mt-1 text-muted">
            Записи, извлечённые из документов/источников — библиотекарь предлагает категорию и каноническое
            название, финальное решение за человеком.
          </p>
        </div>
        <Button variant="secondary" className="shrink-0 px-3 py-1.5" onClick={() => setLegendOpen(true)}>
          Что есть что?
        </Button>
      </div>

      {legendOpen && <LegendModal onClose={() => setLegendOpen(false)} />}

      {error && <div className="mb-6 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-danger">{error}</div>}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-control border border-line bg-surface-1 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleStatusChange(tab.value)}
              className={`rounded-control px-3 py-1.5 text-sm font-medium transition-colors ${
                status === tab.value ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="w-full max-w-md">
          <Input placeholder="Поиск по названию/категории…" value={search} onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={flagOnly} onChange={(e) => setFlagOnly(e.target.checked)} className="rounded border-line" />
          Только похожие на существующие
        </label>
      </div>

      {entries.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mb-4 text-4xl">📋</div>
          <p className="text-muted">{search ? 'Ничего не найдено' : 'Записей нет'}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted">
                    Исходное: <span className="text-ink">{entry.source_work_name}</span>
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {entry.canonical_work_name}
                    <span className="ml-2 font-normal text-muted">
                      ({entry.category || 'без категории'} · {entry.unit})
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    {entry.price_qualifier === 'on_request' ? (
                      'по договору'
                    ) : (
                      <>
                        {entry.price} {entry.currency}
                        {entry.price_qualifier !== 'exact' && (
                          <span className="ml-1 text-muted">({PRICE_QUALIFIER_LABELS[entry.price_qualifier]})</span>
                        )}
                      </>
                    )}
                    <span className="ml-2 text-muted">· {SOURCE_TYPE_LABELS[entry.source_type]}</span>
                    {entry.source_detail && <span className="ml-1 text-muted">· {entry.source_detail}</span>}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {entry.confidence && (
                      <button
                        type="button"
                        onClick={() => setSourceOpenId(sourceOpenId === entry.id ? null : entry.id)}
                        className={`rounded-control px-2 py-0.5 transition-colors ${
                          entry.confidence === 'low' ? 'bg-danger-soft text-danger hover:bg-danger/15' : 'bg-surface-0 text-muted hover:bg-line/60'
                        }`}
                      >
                        уверенность извлечения: {CONFIDENCE_LABELS[entry.confidence]} {sourceOpenId === entry.id ? '▴' : '▾'}
                      </button>
                    )}
                    {entry.category_review_flag && (
                      <button
                        type="button"
                        onClick={() => setSimilarityOpenId(similarityOpenId === entry.id ? null : entry.id)}
                        className="rounded-control bg-accent-soft px-2 py-0.5 text-accent transition-colors hover:bg-accent/15"
                      >
                        похоже на существующее {similarityOpenId === entry.id ? '▴' : '▾'}
                      </button>
                    )}
                    <span className="rounded-control bg-surface-0 px-2 py-0.5 text-muted">
                      {new Date(entry.observed_date).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  {sourceOpenId === entry.id && <SourcePanel entry={entry} />}
                  {similarityOpenId === entry.id && <SimilarityPanel entry={entry} />}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="secondary" className="px-3 py-1.5" onClick={() => setEditingId(editingId === entry.id ? null : entry.id)}>
                    {editingId === entry.id ? 'Закрыть' : 'Изменить'}
                  </Button>
                  {entry.status === 'pending_review' && (
                    <>
                      <Button variant="secondary" className="px-3 py-1.5" onClick={() => applyStatus(entry.id, 'rejected')}>
                        Отклонить
                      </Button>
                      <Button variant="primary" className="px-3 py-1.5" onClick={() => applyStatus(entry.id, 'approved')}>
                        Одобрить
                      </Button>
                    </>
                  )}
                  {entry.status === 'rejected' && isAdmin && (
                    <Button
                      variant="secondary"
                      className="px-3 py-1.5"
                      title="Вернуть запись обратно в очередь «На проверке»"
                      onClick={() => applyStatus(entry.id, 'pending_review')}
                    >
                      Вернуть на проверку
                    </Button>
                  )}
                </div>
              </div>
              {editingId === entry.id && (
                <EditForm
                  entry={entry}
                  onCancel={() => setEditingId(null)}
                  onSaved={(updated) => {
                    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
                    setEditingId(null);
                  }}
                />
              )}
            </Card>
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
