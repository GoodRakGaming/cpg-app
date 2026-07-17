import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ItemsEditor } from '@/components/shared/ItemsEditor';
import { TemplateForm } from '@/lib/useTemplateForm';

const FILE_INPUT_CLASS =
  'w-full text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-control file:border file:border-line ' +
  'file:bg-surface-0 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-text hover:file:bg-surface-1';

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

function RemoveFileLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-1.5 block text-xs font-medium text-danger hover:text-danger/80">
      Отменить выбор
    </button>
  );
}

export function TemplateFormSections({ form, itemsLabel = 'Позиции' }: { form: TemplateForm; itemsLabel?: string }) {
  const {
    name, setName,
    description, setDescription,
    itemsState,
    terms, setTerms,
    company, setCompany,
    signer, setSigner,
    handleLogoUpload, handleSignatureUpload,
    handleRemoveLogo, handleRemoveSignature, handleRemoveStamp,
  } = form;

  return (
    <div className="flex flex-col gap-4">
      {/* Основное */}
      <Card className="overflow-hidden">
        <SectionHeader title="Основное" />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <Field label="Название *">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Стандартный шаблон КП"
              maxLength={255}
            />
          </Field>
          <Field label="Описание">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание шаблона"
              maxLength={500}
            />
          </Field>
        </div>
      </Card>

      {/* Реквизиты юрлица */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Реквизиты юрлица"
          description="Печатаются в шапке PDF. Обязательны для КП: название, адрес, ИНН, контакты."
        />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Название компании">
              <Input
                value={company.name}
                onChange={(e) => setCompany((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="ООО «Профстрой»"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Юридический адрес">
              <Input value={company.address} onChange={(e) => setCompany((prev) => ({ ...prev, address: e.target.value }))} />
            </Field>
          </div>
          <Field label="ИНН">
            <Input value={company.inn} onChange={(e) => setCompany((prev) => ({ ...prev, inn: e.target.value }))} />
          </Field>
          <Field label="Телефон">
            <Input value={company.phone} onChange={(e) => setCompany((prev) => ({ ...prev, phone: e.target.value }))} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Email">
              <Input value={company.email} onChange={(e) => setCompany((prev) => ({ ...prev, email: e.target.value }))} />
            </Field>
          </div>
          <Field label="ОГРН (опционально)">
            <Input value={company.ogrn} onChange={(e) => setCompany((prev) => ({ ...prev, ogrn: e.target.value }))} />
          </Field>
          <Field label="КПП (опционально)">
            <Input value={company.kpp} onChange={(e) => setCompany((prev) => ({ ...prev, kpp: e.target.value }))} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Логотип (опционально)">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                className={FILE_INPUT_CLASS}
              />
              {company.logo && (
                <>
                  <img src={company.logo} alt="Логотип" className="mt-2 h-12 object-contain" />
                  <RemoveFileLink onClick={handleRemoveLogo} />
                </>
              )}
            </Field>
          </div>
        </div>

        <details className="border-t border-line px-5 py-4">
          <summary className="cursor-pointer select-none text-xs text-muted">
            Банковские реквизиты (опционально, показываются только если заполнены)
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Банк">
                <Input
                  value={company.bank?.bankName || ''}
                  onChange={(e) => setCompany((prev) => ({ ...prev, bank: { ...prev.bank, bankName: e.target.value } }))}
                />
              </Field>
            </div>
            <Field label="Р/с">
              <Input
                value={company.bank?.account || ''}
                onChange={(e) => setCompany((prev) => ({ ...prev, bank: { ...prev.bank, account: e.target.value } }))}
              />
            </Field>
            <Field label="БИК">
              <Input
                value={company.bank?.bik || ''}
                onChange={(e) => setCompany((prev) => ({ ...prev, bank: { ...prev.bank, bik: e.target.value } }))}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="К/с">
                <Input
                  value={company.bank?.corrAccount || ''}
                  onChange={(e) => setCompany((prev) => ({ ...prev, bank: { ...prev.bank, corrAccount: e.target.value } }))}
                />
              </Field>
            </div>
          </div>
        </details>
      </Card>

      {/* Подписант */}
      <Card className="overflow-hidden">
        <SectionHeader
          title="Подписант"
          description={'ФИО и должность обязательны для строки подписи в PDF. Скан подписи/печати — опционально; без них печать не имитируется, только "м.п." текстом.'}
        />
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          <Field label="Должность">
            <Input
              value={signer.position}
              onChange={(e) => setSigner((prev) => ({ ...prev, position: e.target.value }))}
              placeholder="Директор"
            />
          </Field>
          <Field label="ФИО">
            <Input value={signer.fullName} onChange={(e) => setSigner((prev) => ({ ...prev, fullName: e.target.value }))} />
          </Field>
          <Field label="Скан подписи (опционально)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleSignatureUpload('signatureImage', e.target.files?.[0])}
              className={FILE_INPUT_CLASS}
            />
            {signer.signatureImage && (
              <>
                <img src={signer.signatureImage} alt="Скан подписи" className="mt-2 h-10 object-contain" />
                <p className="mt-1 text-xs text-muted">Файл уже загружен ранее</p>
                <RemoveFileLink onClick={handleRemoveSignature} />
              </>
            )}
          </Field>
          <Field label="Скан печати (опционально)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleSignatureUpload('stampImage', e.target.files?.[0])}
              className={FILE_INPUT_CLASS}
            />
            {signer.stampImage && (
              <>
                <img src={signer.stampImage} alt="Скан печати" className="mt-2 h-10 object-contain" />
                <p className="mt-1 text-xs text-muted">Файл уже загружен ранее</p>
                <RemoveFileLink onClick={handleRemoveStamp} />
              </>
            )}
          </Field>
        </div>
      </Card>

      {/* Позиции */}
      <ItemsEditor state={itemsState} label={itemsLabel} />

      {/* Условия и футер */}
      <Card className="overflow-hidden">
        <SectionHeader title="Условия" />
        <div className="flex flex-col gap-4 p-5">
          <Field label="Условия договора">
            <textarea
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Условия оплаты, доставки, гарантий..."
              className="w-full resize-y rounded-control border border-line bg-surface-1 px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-soft"
            />
          </Field>
        </div>
      </Card>
    </div>
  );
}
