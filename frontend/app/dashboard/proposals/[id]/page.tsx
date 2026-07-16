'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, Proposal, ProposalVersion, Item, Recipient, API_BASE_URL } from '@/lib/api';
import Link from 'next/link';

const emptyItem = (): Item => ({ name: '', unit: 'шт.', quantity: 1, price: '' });
const emptyRecipient = (): Recipient => ({ position: '', org: '', fullName: '' });

export default function ProposalEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'draft' | 'final' | 'archived'>('draft');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [kpNumber, setKpNumber] = useState('');
  const [kpDate, setKpDate] = useState('');
  const [recipient, setRecipient] = useState<Recipient>(emptyRecipient());
  const [validDays, setValidDays] = useState<number | ''>('');
  const [vatNote, setVatNote] = useState('');

  const [activeTab, setActiveTab] = useState<'content' | 'versions' | 'pdf'>('content');
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<'pending' | 'generating' | 'ready' | 'error'>('pending');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    loadProposal();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'versions' && versions.length === 0) {
      loadVersions();
    }
  }, [activeTab]);


  const applyProposalData = (p: Proposal) => {
    setProposal(p);
    setTitle(p.title);
    setStatus(p.status);
    setDescription(p.data?.description || '');
    setItems(
      Array.isArray(p.data?.items) && p.data.items.length > 0
        ? p.data.items.map((item) => ({ ...item, unit: item.unit || 'шт.' }))
        : [emptyItem()]
    );
    setKpNumber(p.data?.number || '');
    setKpDate(p.data?.date || '');
    setRecipient({ ...emptyRecipient(), ...(p.data?.recipient || {}) });
    setValidDays(p.data?.validDays ?? '');
    setVatNote(p.data?.vatNote || '');
  };

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getProposal(id);
      if (response.success && response.data?.proposal) {
        applyProposalData(response.data.proposal);
      } else {
        setError('Ошибка загрузки предложения');
      }
    } catch (err) {
      setError('Не удалось загрузить предложение');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async () => {
    try {
      setLoadingVersions(true);
      const response = await apiClient.getProposalVersions(id);
      if (response.success && response.data?.versions) {
        setVersions(response.data.versions);
      }
    } catch (err) {
      console.error('Ошибка загрузки версий:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const updateItem = (index: number, field: keyof Item, value: string | number | '') => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const blurNumeric = (index: number, field: 'price' | 'quantity', fallback: number) => {
    setItems((prev) => prev.map((item, i) =>
      i === index && item[field] === '' ? { ...item, [field]: fallback } : item
    ));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + (item.quantity === '' ? 0 : item.quantity) * (item.price === '' ? 0 : item.price), 0);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const normalizedItems = items.map(item => ({
        ...item,
        quantity: item.quantity === '' ? 1 : item.quantity,
        price: item.price === '' ? 0 : item.price,
      }));
      const response = await apiClient.updateProposal(id, {
        title,
        status,
        data: {
          ...(proposal?.data || {}),
          description,
          items: normalizedItems,
          number: kpNumber || undefined,
          date: kpDate || undefined,
          recipient: (recipient.org || recipient.fullName) ? recipient : undefined,
          validDays: validDays === '' ? undefined : validDays,
          vatNote: vatNote || undefined,
        },
      });
      if (response.success && response.data?.proposal) {
        setSuccess('Предложение сохранено');
        setProposal(response.data.proposal);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('Ошибка сохранения');
      }
    } catch (err) {
      setError('Не удалось сохранить предложение');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getToken = () => localStorage.getItem('access_token');

  const handlePreviewPDF = async () => {
    try {
      setPdfGenerating(true);
      setPdfStatus('generating');
      setError(null);

      const response = await fetch(`${API_BASE_URL}/pdf/preview/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const html = await response.text();
      setPreviewHtml(html);
      setPdfStatus('ready');
    } catch (err) {
      setError('Ошибка предпросмотра: ' + (err instanceof Error ? err.message : String(err)));
      setPdfStatus('error');
      console.error(err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfDownloading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/pdf/${id}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proposal?.title || 'proposal'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError('Ошибка скачивания: ' + (err instanceof Error ? err.message : String(err)));
      console.error(err);
    } finally {
      setPdfDownloading(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!window.confirm('Восстановить эту версию?')) return;
    try {
      setError(null);
      const response = await apiClient.restoreProposalVersion(id, versionId);
      if (response.success && response.data?.proposal) {
        applyProposalData(response.data.proposal);
        setSuccess('Версия восстановлена');
        setTimeout(() => setSuccess(null), 3000);
        setVersions([]);
        loadVersions();
      } else {
        setError('Ошибка восстановления версии');
      }
    } catch (err) {
      setError('Не удалось восстановить версию');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка предложения...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Предложение не найдено</p>
        <Link href="/dashboard/proposals" className="text-blue-600 hover:text-blue-700">
          ← Вернуться к списку
        </Link>
      </div>
    );
  }

  const statusLabel =
    proposal.status === 'draft' ? 'Черновик'
    : proposal.status === 'final' ? 'Финальный'
    : 'Архивирован';

  const statusColor =
    proposal.status === 'draft' ? 'bg-yellow-100 text-yellow-800'
    : proposal.status === 'final' ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-800';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Title row */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/proposals" className="text-sm text-blue-600 hover:text-blue-700">
            ← К списку предложений
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{proposal.title}</h1>
          <p className="text-sm text-gray-500">
            Создано: {new Date(proposal.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <span className={`mt-6 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          {(['content', 'versions', 'pdf'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'content' ? 'Содержание' : tab === 'versions' ? 'Версии' : 'PDF'}
            </button>
          ))}
        </div>
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Название предложения</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
            >
              <option value="draft">Черновик</option>
              <option value="final">Финальный</option>
              <option value="archived">Архивирован</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Описание предложения</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Введите описание коммерческого предложения..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none resize-y"
            />
          </div>

          {/* КП meta: номер/дата/срок действия */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Номер КП</label>
              <input
                type="text"
                value={kpNumber}
                onChange={(e) => setKpNumber(e.target.value)}
                placeholder="2026-014"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата КП</label>
              <input
                type="date"
                value={kpDate}
                onChange={(e) => setKpDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Действительно, дн.</label>
              <input
                type="number"
                min={0}
                value={validDays}
                onChange={(e) => setValidDays(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="14"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
              />
            </div>
          </div>

          {/* Получатель */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Получатель</label>
            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={recipient.org}
                onChange={(e) => setRecipient((prev) => ({ ...prev, org: e.target.value }))}
                placeholder="Организация"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
              />
              <input
                type="text"
                value={recipient.position}
                onChange={(e) => setRecipient((prev) => ({ ...prev, position: e.target.value }))}
                placeholder="Должность"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
              />
              <input
                type="text"
                value={recipient.fullName}
                onChange={(e) => setRecipient((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="ФИО"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Примечание об НДС (опционально)</label>
            <input
              type="text"
              value={vatNote}
              onChange={(e) => setVatNote(e.target.value)}
              placeholder="Например: Без НДС (УСН)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Позиции</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Добавить позицию
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-medium text-gray-500 mt-2">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-600 mb-1">Название</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Название услуги или товара"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Раздел (опционально)</label>
                      <input
                        type="text"
                        value={item.section || ''}
                        onChange={(e) => updateItem(index, 'section', e.target.value)}
                        placeholder="Например: Кухня"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ед. изм.</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        placeholder="шт."
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Количество</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                        onBlur={() => blurNumeric(index, 'quantity', 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Цена (руб.)</label>
                      <input
                        type="number"
                        min={0}
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                        onBlur={() => blurNumeric(index, 'price', 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-right text-sm font-medium text-gray-700">
              Итого: <span className="text-blue-600">{total.toLocaleString('ru-RU')} руб.</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              onClick={() => router.push('/dashboard/proposals')}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Versions Tab */}
      {activeTab === 'versions' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {loadingVersions ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Загрузка версий...</p>
            </div>
          ) : versions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Версий пока нет</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Версия</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Изменения</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {versions.map((version) => (
                  <tr key={version.id}>
                    <td className="px-6 py-4 font-medium text-gray-900">v{version.version_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(version.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {version.comment || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRestoreVersion(version.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Восстановить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* PDF Tab */}
      {activeTab === 'pdf' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          {pdfStatus === 'error' && (
            <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-800 text-sm">
              {error || 'Ошибка при генерации PDF.'}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePreviewPDF}
              disabled={pdfGenerating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {pdfGenerating ? 'Загрузка...' : 'Предпросмотр'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={pdfDownloading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {pdfDownloading ? 'Генерация PDF...' : 'Скачать PDF'}
            </button>
          </div>

          {previewHtml ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                srcDoc={previewHtml}
                className="w-full"
                style={{ height: '700px' }}
                title="Предпросмотр"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Нажмите «Предпросмотр» чтобы увидеть документ, «Скачать PDF» — чтобы получить файл.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
