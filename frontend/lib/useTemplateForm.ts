import { useCallback, useState } from 'react';
import { Company, Item, Signer, Template, TemplateData } from '@/lib/api';

export const emptyItem = (): Item => ({ name: '', unit: 'шт.', quantity: 1, price: '' });
const emptyCompany = (): Company => ({ name: '', address: '', inn: '', kpp: '', ogrn: '', phone: '', email: '', bank: {} });
const emptySigner = (): Signer => ({ fullName: '', position: '' });

function itemsFromData(data?: TemplateData): Item[] {
  if (data && Array.isArray(data.items) && data.items.length > 0) {
    return data.items.map((item) => ({ ...item, unit: item.unit || 'шт.' }));
  }
  return [emptyItem()];
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useTemplateForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [terms, setTerms] = useState('');
  const [footer, setFooter] = useState('');
  const [company, setCompany] = useState<Company>(emptyCompany());
  const [signer, setSigner] = useState<Signer>(emptySigner());
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadFrom = useCallback((template: Template) => {
    setName(template.name);
    setDescription(template.description || '');
    setItems(itemsFromData(template.data));
    setTerms(template.data?.terms || '');
    setFooter(template.data?.footer || '');
    setCompany({ ...emptyCompany(), ...(template.data?.company || {}), bank: { ...(template.data?.company?.bank || {}) } });
    setSigner({ ...emptySigner(), ...(template.data?.signer || {}) });
  }, []);

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

  const handleLogoUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setCompany((prev) => ({ ...prev, logo: dataUrl }));
    } catch (err) {
      setUploadError('Не удалось загрузить логотип');
      console.error(err);
    }
  };

  const handleSignatureUpload = async (field: 'signatureImage' | 'stampImage', file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setSigner((prev) => ({ ...prev, [field]: dataUrl }));
    } catch (err) {
      setUploadError('Не удалось загрузить изображение');
      console.error(err);
    }
  };

  const buildData = (): TemplateData => {
    const normalizedItems = items.map((item) => ({
      ...item,
      quantity: item.quantity === '' ? 1 : item.quantity,
      price: item.price === '' ? 0 : item.price,
    }));
    const hasBank = Object.values(company.bank || {}).some((v) => v);
    return {
      items: normalizedItems,
      terms,
      footer,
      company: company.name.trim() ? { ...company, bank: hasBank ? company.bank : undefined } : undefined,
      signer: signer.fullName || signer.position ? signer : undefined,
    };
  };

  return {
    name,
    setName,
    description,
    setDescription,
    items,
    updateItem,
    blurNumeric,
    addItem,
    removeItem,
    total,
    terms,
    setTerms,
    footer,
    setFooter,
    company,
    setCompany,
    signer,
    setSigner,
    handleLogoUpload,
    handleSignatureUpload,
    uploadError,
    loadFrom,
    buildData,
  };
}

export type TemplateForm = ReturnType<typeof useTemplateForm>;
