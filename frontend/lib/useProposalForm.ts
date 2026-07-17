import { useCallback, useState } from 'react';
import { Proposal, ProposalData, Recipient } from '@/lib/api';
import { itemsFromArray, useItems } from '@/lib/useItems';

const emptyRecipient = (): Recipient => ({ position: '', org: '', fullName: '' });

export function useProposalForm() {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'draft' | 'final' | 'archived'>('draft');
  const [description, setDescription] = useState('');
  const itemsState = useItems();
  const [kpNumber, setKpNumber] = useState('');
  const [kpDate, setKpDate] = useState('');
  const [recipient, setRecipient] = useState<Recipient>(emptyRecipient());
  const [validDays, setValidDays] = useState<number | ''>('');
  const [vatNote, setVatNote] = useState('');
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeStamp, setIncludeStamp] = useState(true);

  const loadFrom = useCallback((proposal: Proposal) => {
    setTitle(proposal.title);
    setStatus(proposal.status);
    setDescription(proposal.data?.description || '');
    itemsState.setItems(itemsFromArray(proposal.data?.items));
    setKpNumber(proposal.data?.number || '');
    setKpDate(proposal.data?.date || '');
    setRecipient({ ...emptyRecipient(), ...(proposal.data?.recipient || {}) });
    setValidDays(proposal.data?.validDays ?? '');
    setVatNote(proposal.data?.vatNote || '');
    setIncludeSignature(proposal.data?.includeSignature !== false);
    setIncludeStamp(proposal.data?.includeStamp !== false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildData = (existing?: ProposalData): ProposalData => ({
    ...(existing || {}),
    description,
    items: itemsState.normalized(),
    number: kpNumber || undefined,
    date: kpDate || undefined,
    recipient: recipient.org || recipient.fullName ? recipient : undefined,
    validDays: validDays === '' ? undefined : validDays,
    vatNote: vatNote || undefined,
    includeSignature,
    includeStamp,
  });

  return {
    title,
    setTitle,
    status,
    setStatus,
    description,
    setDescription,
    itemsState,
    kpNumber,
    setKpNumber,
    kpDate,
    setKpDate,
    recipient,
    setRecipient,
    validDays,
    setValidDays,
    vatNote,
    setVatNote,
    includeSignature,
    setIncludeSignature,
    includeStamp,
    setIncludeStamp,
    loadFrom,
    buildData,
  };
}

export type ProposalForm = ReturnType<typeof useProposalForm>;
