import { useCallback, useState } from 'react';
import { Company, Signer, Template, TemplateData } from '@/lib/api';
import { itemsFromArray, useItems } from '@/lib/useItems';

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

export function useTemplateForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const itemsState = useItems();
  const [terms, setTerms] = useState('');
  const [footer, setFooter] = useState('');
  const [company, setCompany] = useState<Company>(emptyCompany());
  const [signer, setSigner] = useState<Signer>(emptySigner());
  const [uploadError, setUploadError] = useState<string | null>(null);

  const loadFrom = useCallback((template: Template) => {
    setName(template.name);
    setDescription(template.description || '');
    itemsState.setItems(itemsFromArray(template.data?.items));
    setTerms(template.data?.terms || '');
    setFooter(template.data?.footer || '');
    setCompany({ ...emptyCompany(), ...(template.data?.company || {}), bank: { ...(template.data?.company?.bank || {}) } });
    setSigner({ ...emptySigner(), ...(template.data?.signer || {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const hasBank = Object.values(company.bank || {}).some((v) => v);
    return {
      items: itemsState.normalized(),
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
    itemsState,
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
