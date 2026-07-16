'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, Item, Company, Signer, TemplateData } from '@/lib/api';
import Link from 'next/link';

const emptyItem = (): Item => ({ name: '', unit: 'шт.', quantity: 1, price: '' });
const emptyCompany = (): Company => ({ name: '', address: '', inn: '', kpp: '', ogrn: '', phone: '', email: '', bank: {} });
const emptySigner = (): Signer => ({ fullName: '', position: '' });

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function NewTemplatePage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [terms, setTerms] = useState('');
  const [footer, setFooter] = useState('');
  const [company, setCompany] = useState<Company>(emptyCompany());
  const [signer, setSigner] = useState<Signer>(emptySigner());
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (index: number, field: keyof Item, value: string | number | '') => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const blurNumeric = (index: number, field: 'price' | 'quantity', fallback: number) => {
    setItems((prev) => prev.map((item, i) =>
      i === index && item[field] === '' ? { ...item, [field]: fallback } : item
    ));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce((sum, item) => sum + (item.quantity === '' ? 0 : item.quantity) * (item.price === '' ? 0 : item.price), 0);

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCompany((prev) => ({ ...prev, logo: dataUrl }));
    } catch (err) {
      setError('Не удалось загрузить логотип');
      console.error(err);
    }
  };

  const handleSignatureUpload = async (field: 'signatureImage' | 'stampImage', file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSigner((prev) => ({ ...prev, [field]: dataUrl }));
    } catch (err) {
      setError('Не удалось загрузить изображение');
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Введите название шаблона');
      return;
    }

    const normalizedItems = items.map(item => ({
      ...item,
      quantity: item.quantity === '' ? 1 : item.quantity,
      price: item.price === '' ? 0 : item.price,
    }));
    const hasBank = Object.values(company.bank || {}).some((v) => v);
    const data: TemplateData = {
      items: normalizedItems,
      terms,
      footer,
      company: company.name.trim() ? { ...company, bank: hasBank ? company.bank : undefined } : undefined,
      signer: (signer.fullName || signer.position) ? signer : undefined,
    };

    try {
      setCreating(true);
      setError(null);
      const response = await apiClient.createTemplate(name.trim(), description.trim(), data);

      if (response.success && response.data?.template?.id) {
        router.push(`/dashboard/templates/${response.data.template.id}`);
      } else {
        setError(response.error?.message || 'Ошибка создания шаблона');
      }
    } catch (err) {
      setError('Не удалось создать шаблон');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Создать шаблон</h1>
        <Link href="/dashboard/templates" className="text-blue-600 hover:text-blue-700">
          ← Назад
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Стандартный шаблон КП"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
              maxLength={255}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание шаблона"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
              maxLength={500}
            />
          </div>

          {/* Company requisites — юрлицо этого шаблона */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Реквизиты юрлица</h2>
            <p className="text-xs text-gray-500 mb-4">Печатаются в шапке PDF. Обязательны для КП: название, адрес, ИНН, контакты.</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Название компании</label>
                <input
                  type="text"
                  value={company.name}
                  onChange={(e) => setCompany((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="ООО «Профстрой»"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Юридический адрес</label>
                <input
                  type="text"
                  value={company.address}
                  onChange={(e) => setCompany((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">ИНН</label>
                <input
                  type="text"
                  value={company.inn}
                  onChange={(e) => setCompany((prev) => ({ ...prev, inn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Телефон</label>
                <input
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Email</label>
                <input
                  type="text"
                  value={company.email}
                  onChange={(e) => setCompany((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">ОГРН (опционально)</label>
                <input
                  type="text"
                  value={company.ogrn}
                  onChange={(e) => setCompany((prev) => ({ ...prev, ogrn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">КПП (опционально)</label>
                <input
                  type="text"
                  value={company.kpp}
                  onChange={(e) => setCompany((prev) => ({ ...prev, kpp: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs text-gray-600 mb-1">Логотип (опционально)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                  className="w-full text-sm text-gray-600"
                />
                {company.logo && (
                  <img src={company.logo} alt="Логотип" className="mt-2 h-12 object-contain" />
                )}
              </div>
            </div>

            <details className="mt-4">
              <summary className="text-xs text-gray-600 cursor-pointer select-none">Банковские реквизиты (опционально, показываются только если заполнены)</summary>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Банк</label>
                  <input
                    type="text"
                    value={company.bank?.bankName || ''}
                    onChange={(e) => setCompany((prev) => ({ ...prev, bank: { ...prev.bank, bankName: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Р/с</label>
                  <input
                    type="text"
                    value={company.bank?.account || ''}
                    onChange={(e) => setCompany((prev) => ({ ...prev, bank: { ...prev.bank, account: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">БИК</label>
                  <input
                    type="text"
                    value={company.bank?.bik || ''}
                    onChange={(e) => setCompany((prev) => ({ ...prev, bank: { ...prev.bank, bik: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">К/с</label>
                  <input
                    type="text"
                    value={company.bank?.corrAccount || ''}
                    onChange={(e) => setCompany((prev) => ({ ...prev, bank: { ...prev.bank, corrAccount: e.target.value } }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Signer — подписант */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Подписант</h2>
            <p className="text-xs text-gray-500 mb-4">
              ФИО и должность обязательны для строки подписи в PDF. Скан подписи/печати — опционально;
              без них печать не имитируется, только "м.п." текстом.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Должность</label>
                <input
                  type="text"
                  value={signer.position}
                  onChange={(e) => setSigner((prev) => ({ ...prev, position: e.target.value }))}
                  placeholder="Директор"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">ФИО</label>
                <input
                  type="text"
                  value={signer.fullName}
                  onChange={(e) => setSigner((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Скан подписи (опционально)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSignatureUpload('signatureImage', e.target.files?.[0])}
                  className="w-full text-sm text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Скан печати (опционально)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleSignatureUpload('stampImage', e.target.files?.[0])}
                  className="w-full text-sm text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">Позиции</label>
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Добавить позицию
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-medium text-gray-500 mt-2">#{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-600 mb-1">Название</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Название услуги или товара"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ед. изм.</label>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => updateItem(index, 'unit', e.target.value)}
                        placeholder="шт."
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Количество</label>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value === '' ? '' : Number(e.target.value))}
                        onBlur={() => blurNumeric(index, 'quantity', 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Цена (руб.)</label>
                      <input
                        type="number"
                        min={0}
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', e.target.value === '' ? '' : Number(e.target.value))}
                        onBlur={() => blurNumeric(index, 'price', 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-right text-sm font-medium text-gray-700">
              Итого: <span className="text-blue-600">{total.toLocaleString('ru-RU')} руб.</span>
            </div>
          </div>

          {/* Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Условия договора</label>
            <textarea
              rows={4}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Условия оплаты, доставки, гарантий..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none resize-y"
            />
          </div>

          {/* Footer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Нижний колонтитул PDF</label>
            <input
              type="text"
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              placeholder="Например: ООО «Компания» · ИНН 1234567890 · +7 (999) 000-00-00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-500">Отображается в нижней части PDF. Оставьте пустым — будет показана только дата.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
            >
              {creating ? 'Создание...' : 'Создать шаблон'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
