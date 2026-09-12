import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Input} from '../../../design/primitives/Input';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import {AddTransactionAccountSection} from './AddTransactionAccountSection';
import {AddTransactionCategorySection} from './AddTransactionCategorySection';
import {AddTransactionDateSection} from './AddTransactionDateSection';
import {AddTransactionReceiptSection} from './AddTransactionReceiptSection';
import {AddTransactionTagsSection} from './AddTransactionTagsSection';

import type {AccountRow} from '../../../db/repositories/accountsRepository';
import type {CategoryRow} from '../../../db/repositories/categoriesRepository';
import type {TagRow} from '../../../db/repositories/tagsRepository';
import type {TransactionType} from '../../../db/repositories/transactionsRepository';
import type {BudgetHint} from '../hooks/useAddTransactionBudgetHint';
import type {AddCategorySuggestion} from '../hooks/useAddTransactionSmartSuggest';
import type {ReceiptDraft} from '../hooks/useReceiptDraft';

export type AddTransactionDetailsProps = {
  type: TransactionType;
  accounts: AccountRow[];
  categories: CategoryRow[];
  tags: TagRow[];
  selectedTagIds: readonly string[];
  newTagName: string;
  accountId: string | null;
  toAccountId: string | null;
  categoryId: string | null;
  categorySuggestion: AddCategorySuggestion | null;
  note: string;
  occurredAt: string;
  budgetHint: BudgetHint;
  receipt: ReceiptDraft;
  onAccountId: (id: string) => void;
  onToAccountId: (id: string) => void;
  onCategoryId: (id: string) => void;
  onToggleTag: (id: string) => void;
  onNewTagName: (name: string) => void;
  onCreateTag: () => void;
  onNote: (note: string) => void;
  onOccurredAt: (iso: string) => void;
  onReceiptChange: (draft: ReceiptDraft) => void;
  onEditAmount: () => void;
};

export function AddTransactionDetails({
  type,
  accounts,
  categories,
  tags,
  selectedTagIds,
  newTagName,
  accountId,
  toAccountId,
  categoryId,
  categorySuggestion,
  note,
  occurredAt,
  budgetHint,
  receipt,
  onAccountId,
  onToAccountId,
  onCategoryId,
  onToggleTag,
  onNewTagName,
  onCreateTag,
  onNote,
  onOccurredAt,
  onReceiptChange,
  onEditAmount,
}: AddTransactionDetailsProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  return (
    <View style={{gap: theme.space[4]}}>
      <Button
        label={t('add.editAmount')}
        variant="ghost"
        onPress={onEditAmount}
      />

      <AddTransactionAccountSection
        accounts={accounts}
        accountId={accountId}
        onAccountId={onAccountId}
      />

      <AddTransactionCategorySection
        type={type}
        accounts={accounts}
        categories={categories}
        accountId={accountId}
        toAccountId={toAccountId}
        categoryId={categoryId}
        budgetHint={budgetHint}
        onToAccountId={onToAccountId}
        onCategoryId={onCategoryId}
      />

      {categorySuggestion && type !== 'transfer' ? (
        <Text variant="caption" color="tertiary">
          {categorySuggestion.source === 'memory'
            ? t('add.smartSuggestMemory')
            : categorySuggestion.source === 'keyword'
              ? t('add.smartSuggestKeyword')
              : t('add.smartSuggestHistory', {
                  count: categorySuggestion.hitCount ?? 0,
                })}
        </Text>
      ) : null}

      {type !== 'transfer' ? (
        <AddTransactionTagsSection
          tags={tags}
          selectedTagIds={selectedTagIds}
          newTagName={newTagName}
          onToggleTag={onToggleTag}
          onNewTagName={onNewTagName}
          onCreateTag={onCreateTag}
        />
      ) : null}

      <AddTransactionDateSection occurredAt={occurredAt} onOccurredAt={onOccurredAt} />

      <Input
        label={t('add.note')}
        value={note}
        onChangeText={onNote}
        placeholder={t('add.notePlaceholder')}
      />

      {type !== 'transfer' ? (
        <AddTransactionReceiptSection draft={receipt} onChange={onReceiptChange} />
      ) : null}
    </View>
  );
}
