import { useState } from 'react';
import { Item } from '@/lib/api';

export const UNIT_OPTIONS = ['шт.', 'м²', 'м³', 'м.п.', 'кг', 'т', 'компл.', 'усл.'];

export const emptyItem = (): Item => ({ name: '', unit: 'шт.', quantity: 1, price: '' });

export function itemsFromArray(items?: Item[] | null): Item[] {
  if (Array.isArray(items) && items.length > 0) {
    return items.map((item) => ({ ...item, unit: item.unit || 'шт.' }));
  }
  return [emptyItem()];
}

export function useItems(initial: Item[] = [emptyItem()]) {
  const [items, setItems] = useState<Item[]>(initial);

  const updateItem = (index: number, field: keyof Item, value: string | number | '') => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const blurNumeric = (index: number, field: 'price' | 'quantity', fallback: number) => {
    setItems((prev) => prev.map((item, i) => (i === index && item[field] === '' ? { ...item, [field]: fallback } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const total = items.reduce(
    (sum, item) => sum + (item.quantity === '' ? 0 : item.quantity) * (item.price === '' ? 0 : item.price),
    0
  );

  const normalized = () =>
    items.map((item) => ({
      ...item,
      quantity: item.quantity === '' ? 1 : item.quantity,
      price: item.price === '' ? 0 : item.price,
    }));

  return { items, setItems, updateItem, blurNumeric, addItem, removeItem, total, normalized };
}

export type ItemsState = ReturnType<typeof useItems>;
