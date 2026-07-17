import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface FileUploadFieldProps {
  value?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  alt: string;
}

export function FileUploadField({ value, onSelect, onRemove, alt }: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = '';
        }}
      />
      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" className="shrink-0 px-3 py-1.5" onClick={() => inputRef.current?.click()}>
          Выбор файла
        </Button>

        {value ? (
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            className="cursor-zoom-in rounded-control border border-line bg-surface-0 p-1"
            title="Нажмите, чтобы увеличить"
          >
            <img src={value} alt={alt} className="h-10 object-contain" />
          </button>
        ) : (
          <span className="text-sm text-muted">Не выбран ни один файл</span>
        )}
      </div>

      {value && (
        <button type="button" onClick={onRemove} className="mt-1.5 block text-xs font-medium text-danger hover:text-danger/80">
          Отменить выбор
        </button>
      )}

      {zoomOpen && value && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-8"
          onClick={() => setZoomOpen(false)}
        >
          <img src={value} alt={alt} className="max-h-full max-w-full rounded-card bg-white object-contain shadow-card" />
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute right-6 top-6 text-2xl leading-none text-white/80 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
