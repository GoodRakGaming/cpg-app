import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ItemsEditor } from '@/components/shared/ItemsEditor';
import { ProposalForm } from '@/lib/useProposalForm';

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-line px-5 py-4">
      <div className="text-sm font-bold text-ink">{title}</div>
      {description && <div className="mt-1 text-xs text-muted">{description}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      {children}
    </div>
  );
}

const SELECT_CLASS =
  'w-full rounded-control border border-line bg-surface-1 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft';

export function ProposalFormSections({ form }: { form: ProposalForm }) {
  const {
    title, setTitle,
    status, setStatus,
    description, setDescription,
    itemsState,
    kpNumber, setKpNumber,
    kpDate, setKpDate,
    recipient, setRecipient,
    validDays, setValidDays,
    vatNote, setVatNote,
  } = form;

  return (
    <div className="flex flex-col gap-4">
      {/* Основное */}
      <Card className="overflow-hidden">
        <SectionHeader title="Основное" />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Название предложения">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
          </div>
          <Field label="Статус">
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className={SELECT_CLASS}>
              <option value="draft">Черновик</option>
              <option value="final">Финальный</option>
              <option value="archived">Архивирован</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Описание предложения">
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Введите описание коммерческого предложения..."
                className="w-full resize-y rounded-control border border-line bg-surface-1 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
              />
            </Field>
          </div>
        </div>
      </Card>

      {/* Реквизиты КП */}
      <Card className="overflow-hidden">
        <SectionHeader title="Реквизиты КП" />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
          <Field label="Номер КП">
            <Input value={kpNumber} onChange={(e) => setKpNumber(e.target.value)} placeholder="2026-014" />
          </Field>
          <Field label="Дата КП">
            <Input type="date" value={kpDate} onChange={(e) => setKpDate(e.target.value)} />
          </Field>
          <Field label="Действительно, дн.">
            <Input
              type="number"
              min={0}
              value={validDays}
              onChange={(e) => setValidDays(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="14"
            />
          </Field>
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs text-muted">Получатель</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                value={recipient.org}
                onChange={(e) => setRecipient((prev) => ({ ...prev, org: e.target.value }))}
                placeholder="Организация"
              />
              <Input
                value={recipient.position}
                onChange={(e) => setRecipient((prev) => ({ ...prev, position: e.target.value }))}
                placeholder="Должность"
              />
              <Input
                value={recipient.fullName}
                onChange={(e) => setRecipient((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="ФИО"
              />
            </div>
          </div>
          <div className="sm:col-span-3">
            <Field label="Примечание об НДС (опционально)">
              <Input value={vatNote} onChange={(e) => setVatNote(e.target.value)} placeholder="Например: Без НДС (УСН)" />
            </Field>
          </div>
        </div>
      </Card>

      {/* Позиции */}
      <ItemsEditor state={itemsState} withSection />
    </div>
  );
}
