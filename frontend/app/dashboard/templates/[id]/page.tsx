'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, Template } from '@/lib/api';
import Link from 'next/link';

interface Item {
  name: string;
  description: string;
  quantity: number | '';
  price: number | '';
}

const emptyItem = (): Item => ({ name: '', description: '', quantity: 1, price: '' });

function itemsFromData(data: Record<string, any>): Item[] {
  if (Array.isArray(data?.items) && data.items.length > 0) return data.items;
  return [emptyItem()];
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [terms, setTerms] = useState('');
  const [footer, setFooter] = useState('');

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.getTemplate(id);
      if (response.success && response.data?.template) {
        const t = response.data.template;
        setTemplate(t);
        setName(t.name);
        setDescription(t.description || '');
        setItems(itemsFromData(t.data));
        setTerms(t.data?.terms || '');
        setFooter(t.data?.footer || '');
      } else {
        setError('Шаблон не найден');
      }
    } catch (err) {
      setError('Не удалось загрузить шаблон');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Название не может быть пустым');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const normalizedItems = items.map(item => ({
        ...item,
        quantity: item.quantity === '' ? 1 : item.quantity,
        price: item.price === '' ? 0 : item.price,
      }));
      const data = { items: normalizedItems, terms, footer };
      const response = await apiClient.updateTemplate(id, name.trim(), description.trim(), data);

      if (response.success && response.data?.template) {
        setTemplate(response.data.template);
        router.push('/dashboard/templates');
      } else {
        setError(response.error?.message || 'Ошибка сохранения');
      }
    } catch (err) {
      setError('Не удалось сохранить шаблон');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить шаблон? Это не затронет уже созданные предложения.')) return;
    try {
      setDeleting(true);
      await apiClient.deleteTemplate(id);
      router.push('/dashboard/templates');
    } catch (err) {
      setError('Не удалось удалить шаблон');
      setDeleting(false);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка шаблона...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600 mb-4">Шаблон не найден</p>
        <Link href="/dashboard/templates" className="text-blue-600 hover:text-blue-700">
          ← Вернуться к списку
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/templates" className="text-sm text-blue-600 hover:text-blue-700">
            ← К списку шаблонов
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{template.name}</h1>
          <p className="text-sm text-gray-500">
            Версия {template.version} · Создан {new Date(template.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="mt-6 px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 font-medium whitespace-nowrap"
        >
          {deleting ? 'Удаление...' : 'Удалить шаблон'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">{success}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none"
            maxLength={500}
          />
        </div>

        {/* Items */}
        <div>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Название</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Название услуги или товара"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Описание</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Краткое описание"
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
                  <div>
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
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            onClick={() => router.push('/dashboard/templates')}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
