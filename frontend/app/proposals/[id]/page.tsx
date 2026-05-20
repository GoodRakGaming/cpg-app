'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface Proposal {
  id: string;
  title: string;
  status: 'draft' | 'final' | 'archived';
  data: Record<string, any>;
  template_id: string;
  created_at: string;
  updated_at: string;
}

interface ProposalVersion {
  id: string;
  proposal_id: string;
  version_number: number;
  data: Record<string, any>;
  created_at: string;
}

export default function ProposalEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // State management
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    status: 'draft' as const,
  });

  // Tabs state
  const [activeTab, setActiveTab] = useState<'content' | 'versions' | 'pdf'>('content');

  // Versions state
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // PDF state
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfStatus, setPdfStatus] = useState<string>('pending');

  // Load proposal data on mount
  useEffect(() => {
    loadProposal();
  }, [id]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getProposal(id);
      if (response.success && response.data) {
        setProposal(response.data);
        setFormData({
          title: response.data.title,
          status: response.data.status,
        });
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
      if (response.success && response.data) {
        setVersions(response.data);
      }
    } catch (err) {
      console.error('Ошибка загрузки версий:', err);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Load versions when tab changes
  useEffect(() => {
    if (activeTab === 'versions' && versions.length === 0) {
      loadVersions();
    }
  }, [activeTab]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await apiClient.updateProposal(id, {
        title: formData.title,
        status: formData.status,
        data: proposal?.data || {},
      });

      if (response.success) {
        setSuccess('Предложение сохранено');
        setProposal(response.data);
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

  const handleGeneratePDF = async () => {
    try {
      setPdfGenerating(true);
      setPdfStatus('generating');
      setError(null);

      const response = await apiClient.generatePDF(id);
      if (response.success) {
        setSuccess('PDF генерируется...');
        // Poll for PDF status
        checkPDFStatus();
      } else {
        setError('Ошибка генерации PDF');
        setPdfStatus('error');
      }
    } catch (err) {
      setError('Не удалось сгенерировать PDF');
      setPdfStatus('error');
      console.error(err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const checkPDFStatus = async () => {
    try {
      const response = await apiClient.getPDFStatus(id);
      if (response.success && response.data) {
        if (response.data.status === 'ready') {
          setPdfStatus('ready');
          setPdfUrl(response.data.url);
          setSuccess('PDF готов к скачиванию');
        } else if (response.data.status === 'generating') {
          setPdfStatus('generating');
          // Check again in 2 seconds
          setTimeout(checkPDFStatus, 2000);
        }
      }
    } catch (err) {
      console.error('Ошибка проверки статуса PDF:', err);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await apiClient.downloadPDF(id);
      if (response.success) {
        // Trigger download
        const link = document.createElement('a');
        link.href = response.data?.url || `/pdf/${id}`;
        link.download = `proposal-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setError('Ошибка скачивания PDF');
      }
    } catch (err) {
      setError('Не удалось скачать PDF');
      console.error(err);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!window.confirm('Восстановить эту версию?')) return;

    try {
      setError(null);
      const response = await apiClient.restoreProposalVersion(id, versionId);
      if (response.success && response.data) {
        setProposal(response.data);
        setFormData({
          title: response.data.title,
          status: response.data.status,
        });
        setSuccess('Версия восстановлена');
        setTimeout(() => setSuccess(null), 3000);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка предложения...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Предложение не найдено</p>
          <Link href="/proposals" className="text-blue-600 hover:text-blue-700">
            ← Вернуться к списку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/proposals"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                ← Назад
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
                <p className="text-sm text-gray-500">
                  Создано: {new Date(proposal.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                proposal.status === 'draft'
                  ? 'bg-yellow-100 text-yellow-800'
                  : proposal.status === 'final'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {proposal.status === 'draft' ? '📝 Черновик' : proposal.status === 'final' ? '✅ Финальный' : '📦 Архивирован'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            ✅ {success}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('content')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'content'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              📝 Содержание
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'versions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              📚 Версии
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pdf'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              📄 PDF
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="space-y-6">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название предложения
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                    placeholder="Введите название"
                  />
                </div>

                {/* Status Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Статус
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
                  >
                    <option value="draft">📝 Черновик</option>
                    <option value="final">✅ Финальный</option>
                    <option value="archived">📦 Архивирован</option>
                  </select>
                </div>

                {/* Data JSON Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Данные предложения (JSON)
                  </label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-sm max-h-64 overflow-auto">
                    <pre>{JSON.stringify(proposal.data, null, 2)}</pre>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Полное редактирование JSON доступно через API
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
                  >
                    {saving ? '💾 Сохранение...' : '💾 Сохранить'}
                  </button>
                  <button
                    onClick={() => router.push('/proposals')}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Versions Tab */}
        {activeTab === 'versions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              {loadingVersions ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">Загрузка версий...</p>
                </div>
              ) : versions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Нет версий</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Версия
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Дата создания
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Действие
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {versions.map((version) => (
                        <tr key={version.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-medium text-gray-900">v{version.version_number}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(version.created_at).toLocaleString('ru-RU')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
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
                </div>
              )}
            </div>
          </div>
        )}

        {/* PDF Tab */}
        {activeTab === 'pdf' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="space-y-6">
                {/* PDF Status */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    {pdfStatus === 'pending' && '⏳ PDF еще не генерировался. Нажмите "Генерировать PDF"'}
                    {pdfStatus === 'generating' && '🔄 PDF генерируется...'}
                    {pdfStatus === 'ready' && '✅ PDF готов к скачиванию'}
                    {pdfStatus === 'error' && '❌ Ошибка при генерации PDF'}
                  </p>
                </div>

                {/* PDF Preview (placeholder) */}
                {pdfUrl && (
                  <div className="border border-gray-300 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 p-4 text-center">
                      <p className="text-gray-600 mb-4">📄 PDF готов</p>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Открыть в новой вкладке
                      </a>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleGeneratePDF}
                    disabled={pdfGenerating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
                  >
                    {pdfGenerating ? '⏳ Генерация...' : '🔄 Генерировать PDF'}
                  </button>
                  {pdfUrl && (
                    <button
                      onClick={handleDownloadPDF}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                    >
                      📥 Скачать PDF
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <p>💡 Система автоматически генерирует PDF на основе шаблона и данных предложения.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
