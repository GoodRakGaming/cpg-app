'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, Proposal, ProposalVersion, API_BASE_URL } from '@/lib/api';
import { useProposalForm } from '@/lib/useProposalForm';
import { ProposalFormSections } from '@/components/proposals/ProposalFormSections';
import { VersionsModal } from '@/components/proposals/VersionsModal';
import { PdfPreviewPanel } from '@/components/proposals/PdfPreviewPanel';
import { Badge, BadgeStatus } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SaveBar } from '@/components/ui/SaveBar';

const STATUS_LABEL: Record<BadgeStatus, string> = {
  draft: 'Черновик',
  final: 'Финальный',
  archived: 'Архивирован',
};

export default function ProposalEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const form = useProposalForm();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<ProposalVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [pdfFullscreen, setPdfFullscreen] = useState(false);

  useEffect(() => {
    loadProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getProposal(id);
      if (response.success && response.data?.proposal) {
        setProposal(response.data.proposal);
        form.loadFrom(response.data.proposal);
        handlePreviewPDF();
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

  const openVersions = () => {
    setVersionsOpen(true);
    if (versions.length === 0) loadVersions();
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await apiClient.updateProposal(id, {
        title: form.title,
        status: form.status,
        data: form.buildData(proposal?.data),
      });
      if (response.success && response.data?.proposal) {
        setProposal(response.data.proposal);
        setSavedAt(new Date());
        handlePreviewPDF();
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
      setPdfError(false);

      const response = await fetch(`${API_BASE_URL}/pdf/preview/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const html = await response.text();
      setPreviewHtml(html);
    } catch (err) {
      setPdfError(true);
      console.error(err);
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfDownloading(true);

      const response = await fetch(`${API_BASE_URL}/pdf/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
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
        setProposal(response.data.proposal);
        form.loadFrom(response.data.proposal);
        setVersionsOpen(false);
        setVersions([]);
        handlePreviewPDF();
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
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent"></div>
          <p className="text-muted">Загрузка предложения...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-danger">Предложение не найдено</p>
        <Link href="/dashboard/proposals" className="text-accent hover:text-accent-hover">
          ← Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/proposals" className="text-sm text-accent hover:text-accent-hover">
            ← К списку предложений
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-ink">{proposal.title}</h1>
          <p className="text-sm text-muted">Создано: {new Date(proposal.created_at).toLocaleDateString('ru-RU')}</p>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Badge status={proposal.status}>{STATUS_LABEL[proposal.status]}</Badge>
          <Button variant="secondary" onClick={openVersions}>
            Версии
          </Button>
          <Button variant="primary" onClick={handleDownloadPDF} disabled={pdfDownloading}>
            {pdfDownloading ? 'Генерация...' : 'Скачать PDF'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-control border border-danger/20 bg-danger-soft px-4 py-3 text-danger">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <ProposalFormSections form={form} />
          <SaveBar
            onSave={handleSave}
            onCancel={() => router.push('/dashboard/proposals')}
            saving={saving}
            saveLabel="Сохранить"
            savingLabel="Сохранение..."
            savedAt={savedAt}
            extra={
              <Button
                type="button"
                variant="secondary"
                className="lg:hidden"
                onClick={() => setPdfFullscreen(true)}
                disabled={!previewHtml && !pdfError}
              >
                {pdfGenerating && !previewHtml ? 'Формирование превью...' : 'Показать превью PDF'}
              </Button>
            }
          />
        </div>
        <div>
          <PdfPreviewPanel
            previewHtml={previewHtml}
            generating={pdfGenerating}
            error={pdfError}
            onRefresh={handlePreviewPDF}
            fullscreen={pdfFullscreen}
            onFullscreenChange={setPdfFullscreen}
          />
        </div>
      </div>

      <VersionsModal
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        versions={versions}
        loading={loadingVersions}
        onRestore={handleRestoreVersion}
      />
    </div>
  );
}
