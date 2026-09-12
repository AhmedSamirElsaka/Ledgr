import {useCallback, useState} from 'react';

export type ReceiptDraft = {
  /** Existing relative path from DB (or after save). */
  storedRelativePath: string | null;
  /** Newly picked absolute/file URI pending save. */
  pendingSourceUri: string | null;
  pendingMimeType: string | null;
  removed: boolean;
};

export function emptyReceiptDraft(): ReceiptDraft {
  return {
    storedRelativePath: null,
    pendingSourceUri: null,
    pendingMimeType: null,
    removed: false,
  };
}

export function receiptDraftFromStored(path: string | null): ReceiptDraft {
  return {
    storedRelativePath: path,
    pendingSourceUri: null,
    pendingMimeType: null,
    removed: false,
  };
}

export function useReceiptDraft(initial: ReceiptDraft = emptyReceiptDraft()) {
  const [draft, setDraft] = useState<ReceiptDraft>(initial);

  const resetFromStored = useCallback((path: string | null) => {
    setDraft(receiptDraftFromStored(path));
  }, []);

  const clearForDuplicate = useCallback(() => {
    setDraft(emptyReceiptDraft());
  }, []);

  return {draft, setDraft, resetFromStored, clearForDuplicate};
}
