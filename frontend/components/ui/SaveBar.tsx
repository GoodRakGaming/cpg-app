import { Button } from '@/components/ui/Button';

interface SaveBarProps {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  saveLabel: string;
  savingLabel: string;
  savedAt?: Date | null;
}

export function SaveBar({ onSave, onCancel, saving, saveLabel, savingLabel, savedAt }: SaveBarProps) {
  return (
    <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-between gap-3 rounded-card border border-line bg-surface-1 px-5 py-3 shadow-card">
      <span className="text-xs text-muted">
        {savedAt ? `Сохранено · ${savedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : ''}
      </span>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="button" variant="primary" onClick={onSave} disabled={saving}>
          {saving ? savingLabel : saveLabel}
        </Button>
      </div>
    </div>
  );
}
