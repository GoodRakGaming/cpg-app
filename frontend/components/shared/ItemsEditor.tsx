import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ItemsState, UNIT_OPTIONS } from '@/lib/useItems';

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

export function ItemsEditor({
  state,
  label = 'Позиции',
  withSection = false,
}: {
  state: ItemsState;
  label?: string;
  withSection?: boolean;
}) {
  const { items, updateItem, blurNumeric, addItem, removeItem, total } = state;

  return (
    // Без overflow-hidden: он ломает position: sticky у плашки (карточка стала бы
    // scroll-контейнером); углы скругляются на самой плашке и подвале
    <Card>
      {/* Плашка закреплена при прокрутке: название, итог и кнопка добавления всегда видны */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-card border-b border-line bg-surface-1 px-5 py-4">
        <div className="flex items-baseline gap-3">
          <div className="text-sm font-bold text-ink">{label}</div>
          <div className="text-xs text-muted">
            Итого: <span className="font-mono text-accent">{total.toLocaleString('ru-RU')} руб.</span>
          </div>
        </div>
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
              {withSection && (
                <div className="col-span-2">
                  <Field label="Раздел (опционально)">
                    <Input
                      value={item.section || ''}
                      onChange={(e) => updateItem(index, 'section', e.target.value)}
                      placeholder="Например: Кухня"
                    />
                  </Field>
                </div>
              )}
              <Field label="Ед. изм.">
                <select value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} className={SELECT_CLASS}>
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
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
        {/* Дублирующая кнопка внизу: при длинном списке новая позиция добавляется в конец —
            заполнять её удобно, не прокручивая наверх и обратно */}
        <button
          type="button"
          onClick={addItem}
          className="rounded-nested border border-dashed border-line py-3 text-sm font-semibold text-accent transition-colors hover:border-accent hover:bg-accent-soft"
        >
          + Добавить позицию
        </button>
      </div>
      <div className="rounded-b-card border-t border-line px-5 py-3 text-right text-sm font-medium text-text">
        Итого: <span className="font-mono text-accent">{total.toLocaleString('ru-RU')} руб.</span>
      </div>
    </Card>
  );
}
