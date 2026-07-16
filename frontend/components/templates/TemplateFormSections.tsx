import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
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

export function TemplateFormSections({ form, itemsLabel = 'Позиции' }: { form: TemplateForm; itemsLabel?: string }) {
  const {
    name, setName,
    description, setDescription,
    items, updateItem, blurNumeric, addItem, removeItem, total,
    terms, setTerms,
    footer, setFooter,
    company, setCompany,
    signer, setSigner,
    handleLogoUpload, handleSignatureUpload,
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
              {company.logo && <img src={company.logo} alt="Логотип" className="mt-2 h-12 object-contain" />}
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
          </Field>
          <Field label="Скан печати (опционально)">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleSignatureUpload('stampImage', e.target.files?.[0])}
              className={FILE_INPUT_CLASS}
            />
          </Field>
        </div>
      </Card>

      {/* Позиции */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="text-sm font-bold text-ink">{itemsLabel}</div>
          <button type="button" onClick={addItem} className="text-sm font-semibold text-accent hover:text-accent-hover">
            + Добавить позицию
          </button>
        </div>
        <div className="flex flex-col gap-3 p-5">
          {items.map((item, index) => (
            <div key={index} className="rounded-nested border border-line bg-surface-0 p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <span className="mt-2 text-xs font-medium text-muted">#{index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="text-lg leading-none text-danger/60 hover:text-danger disabled:opacity-30"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-4">
                  <Field label="Название">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Название услуги или товара"
                    />
                  </Field>
                </div>
                <Field label="Ед. изм.">
                  <Input value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} placeholder="шт." />
                </Field>
                <Field label="Количество">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                    onBlur={() => blurNumeric(index, 'quantity', 1)}
                  />
                </Field>
                <div className="col-span-2">
                  <Field label="Цена (руб.)">
                    <Input
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                      onBlur={() => blurNumeric(index, 'price', 0)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-line px-5 py-3 text-right text-sm font-medium text-text">
          Итого: <span className="font-mono text-accent">{total.toLocaleString('ru-RU')} руб.</span>
        </div>
      </Card>

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
          <Field label="Нижний колонтитул PDF">
            <Input
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="Например: ООО «Компания» · ИНН 1234567890 · +7 (999) 000-00-00"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-muted">Отображается в нижней части PDF. Оставьте пустым — будет показана только дата.</p>
          </Field>
        </div>
      </Card>
    </div>
  );
}
