import {createId} from './id';
import {getPrefString, removePref, setPrefString} from './prefs';

const PREF_KEY = 'templates.transactions';

export type TransactionTemplateType = 'expense' | 'income';

export type TransactionTemplate = {
  id: string;
  name: string;
  type: TransactionTemplateType;
  amountMinor: number;
  currency: string;
  categoryId: string | null;
  accountId: string | null;
  note: string;
};

export type CreateTransactionTemplateInput = {
  name: string;
  type: TransactionTemplateType;
  amountMinor: number;
  currency: string;
  categoryId?: string | null;
  accountId?: string | null;
  note?: string;
};

function isTemplateType(value: unknown): value is TransactionTemplateType {
  return value === 'expense' || value === 'income';
}

function parseTemplate(raw: unknown): TransactionTemplate | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const row = raw as Record<string, unknown>;
  const id = typeof row.id === 'string' ? row.id : null;
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  const type = isTemplateType(row.type) ? row.type : null;
  const amountMinor =
    typeof row.amountMinor === 'number' && Number.isFinite(row.amountMinor)
      ? Math.max(0, Math.trunc(row.amountMinor))
      : null;
  const currency = typeof row.currency === 'string' && row.currency.length > 0
    ? row.currency
    : 'EGP';
  if (!id || !name || !type || amountMinor == null || amountMinor <= 0) {
    return null;
  }
  return {
    id,
    name,
    type,
    amountMinor,
    currency,
    categoryId: typeof row.categoryId === 'string' ? row.categoryId : null,
    accountId: typeof row.accountId === 'string' ? row.accountId : null,
    note: typeof row.note === 'string' ? row.note : '',
  };
}

export function listTransactionTemplates(): TransactionTemplate[] {
  const raw = getPrefString(PREF_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map(parseTemplate)
      .filter((row): row is TransactionTemplate => row != null);
  } catch {
    return [];
  }
}

function persist(templates: TransactionTemplate[]): void {
  if (templates.length === 0) {
    removePref(PREF_KEY);
    return;
  }
  setPrefString(PREF_KEY, JSON.stringify(templates));
}

export function saveTransactionTemplate(
  input: CreateTransactionTemplateInput,
): TransactionTemplate {
  const name = input.name.trim();
  if (!name) {
    throw new Error('Template name required');
  }
  if (!Number.isFinite(input.amountMinor) || input.amountMinor <= 0) {
    throw new Error('Template amount required');
  }
  const next: TransactionTemplate = {
    id: createId(),
    name,
    type: input.type,
    amountMinor: Math.trunc(input.amountMinor),
    currency: input.currency,
    categoryId: input.categoryId ?? null,
    accountId: input.accountId ?? null,
    note: (input.note ?? '').trim(),
  };
  const templates = listTransactionTemplates();
  templates.unshift(next);
  persist(templates.slice(0, 24));
  return next;
}

export function deleteTransactionTemplate(id: string): void {
  persist(listTransactionTemplates().filter(row => row.id !== id));
}
