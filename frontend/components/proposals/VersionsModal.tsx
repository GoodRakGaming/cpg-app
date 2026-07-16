import { ProposalVersion } from '@/lib/api';

interface VersionsModalProps {
  open: boolean;
  onClose: () => void;
  versions: ProposalVersion[];
  loading: boolean;
  onRestore: (versionId: string) => void;
}

export function VersionsModal({ open, onClose, versions, loading, onRestore }: VersionsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-card border border-line bg-surface-1 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="text-sm font-bold text-ink">Версии</div>
          <button type="button" onClick={onClose} className="text-lg leading-none text-muted hover:text-ink">
            ×
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-line border-t-accent"></div>
              <p className="text-muted">Загрузка версий...</p>
            </div>
          ) : versions.length === 0 ? (
            <p className="py-8 text-center text-muted">Версий пока нет</p>
          ) : (
            <table className="w-full">
              <thead className="border-b border-line bg-surface-0">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Версия</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Дата</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Изменения</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-muted">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {versions.map((version) => (
                  <tr key={version.id}>
                    <td className="px-5 py-3 font-mono text-sm text-ink">v{version.version_number}</td>
                    <td className="px-5 py-3 font-mono text-sm text-muted">
                      {new Date(version.created_at).toLocaleString('ru-RU')}
                    </td>
                    <td className="px-5 py-3 text-sm text-muted">{version.comment || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRestore(version.id)}
                        className="text-sm font-semibold text-accent hover:text-accent-hover"
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
      </div>
    </div>
  );
}
