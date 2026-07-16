import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface PdfPreviewPanelProps {
  previewHtml: string | null;
  generating: boolean;
  error: boolean;
  onRefresh: () => void;
  fullscreen: boolean;
  onFullscreenChange: (open: boolean) => void;
}

// The PDF template renders a fixed 210mm-wide page (see backend pdfService.js, `.page { width: 210mm }`).
// 210mm ≈ 794px at 96 CSS px/inch.
const PDF_PAGE_WIDTH_PX = 794;

function injectZoom(html: string, scale: number): string {
  const style = `<style>html{zoom:${scale};}</style>`;
  return html.includes('<head>') ? html.replace('<head>', `<head>${style}`) : style + html;
}

/**
 * Renders the (fixed A4-width) preview HTML scaled to fit the container width.
 * Scaling is done via CSS `zoom` injected *inside* the iframe's own document
 * rather than an outer `transform: scale()` — a transform doesn't shrink the
 * element's layout box (only its paint), which left stray scrollbars and
 * dead space when tried. `zoom` actually resizes the layout, so the iframe's
 * own natural size already matches what's visible — no clipping wrapper needed.
 */
function ScaledPdfFrame({ html, title }: { html: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => setScale(container.clientWidth / PDF_PAGE_WIDTH_PX);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const measureHeight = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    setHeight(doc.documentElement.scrollHeight);
  };

  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      {scale !== null && (
        <iframe
          ref={iframeRef}
          srcDoc={injectZoom(html, scale)}
          title={title}
          sandbox="allow-same-origin allow-scripts"
          onLoad={measureHeight}
          style={{ width: '100%', height: height ?? '100%', border: 'none', display: 'block' }}
        />
      )}
    </div>
  );
}

export function PdfPreviewPanel({ previewHtml, generating, error, onRefresh, fullscreen, onFullscreenChange }: PdfPreviewPanelProps) {
  const previewBody = error ? (
    <div className="p-5 text-sm text-danger">Ошибка при генерации PDF.</div>
  ) : previewHtml ? (
    <ScaledPdfFrame html={previewHtml} title="Предпросмотр PDF" />
  ) : (
    <div className="flex h-full items-center justify-center p-5 text-center text-sm text-muted">
      {generating ? 'Формирование превью...' : 'Нажмите «Обновить превью», чтобы увидеть документ.'}
    </div>
  );

  return (
    <>
      {/* Desktop / wide screens: live side panel */}
      <Card className="sticky top-4 hidden h-[calc(100vh-2rem)] flex-col overflow-hidden lg:flex">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="text-sm font-bold text-ink">PDF</div>
          <div className="flex gap-2">
            {previewHtml && !error && (
              <Button variant="secondary" className="px-3 py-1.5" onClick={() => onFullscreenChange(true)}>
                ⤢ На весь экран
              </Button>
            )}
            <Button variant="secondary" className="px-3 py-1.5" onClick={onRefresh} disabled={generating}>
              {generating ? 'Обновление...' : 'Обновить превью'}
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 bg-surface-0">{previewBody}</div>
      </Card>

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/60 p-4" onClick={() => onFullscreenChange(false)}>
          <div
            className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-card border border-line bg-surface-1 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <Button variant="secondary" className="px-3 py-1.5" onClick={onRefresh} disabled={generating}>
                {generating ? 'Обновление...' : 'Обновить превью'}
              </Button>
              <button type="button" onClick={() => onFullscreenChange(false)} className="text-lg leading-none text-muted hover:text-ink">
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1">{previewBody}</div>
          </div>
        </div>
      )}
    </>
  );
}
