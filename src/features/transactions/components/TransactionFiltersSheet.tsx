import {ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Sheet} from '../../../design/primitives/Sheet';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {EMPTY_TX_FILTERS, type TxFilterState} from '../transactionFilters';

import {FilterAmountSection} from './FilterAmountSection';
import {FilterChipSection} from './FilterChipSection';
import {FilterDateSection} from './FilterDateSection';
import {FilterEntitySection} from './FilterEntitySection';
import {FILTER_SOURCES, FILTER_TYPES} from './filterSheetConstants';
import {FilterTagSection} from './FilterTagSection';

import type {AccountRow} from '../../../db/repositories/accountsRepository';
import type {CategoryRow} from '../../../db/repositories/categoriesRepository';
import type {TagRow} from '../../../db/repositories/tagsRepository';
import type {
  TransactionSource,
  TransactionType,
} from '../../../db/repositories/transactionsRepository';

export type TransactionFiltersSheetProps = {
  visible: boolean;
  draft: TxFilterState;
  accounts: AccountRow[];
  categories: CategoryRow[];
  tags: TagRow[];
  amountCurrencyLabel: string;
  onChange: (next: TxFilterState) => void;
  onApply: () => void;
  onClearAll: () => void;
  onClose: () => void;
};

function typeLabel(
  id: TransactionType | null,
  t: (key: string) => string,
): string {
  if (id == null) {
    return t('activity.any');
  }
  if (id === 'expense') {
    return t('activity.typeExpense');
  }
  if (id === 'income') {
    return t('activity.typeIncome');
  }
  return t('activity.typeTransfer');
}

function sourceLabel(
  id: TransactionSource | null,
  t: (key: string) => string,
): string {
  if (id == null) {
    return t('activity.any');
  }
  if (id === 'manual') {
    return t('activity.sourceManual');
  }
  if (id === 'sms') {
    return t('activity.sourceSms');
  }
  if (id === 'import') {
    return t('activity.sourceImport');
  }
  return t('activity.sourceRecurring');
}

export function TransactionFiltersSheet({
  visible,
  draft,
  accounts,
  categories,
  tags,
  amountCurrencyLabel,
  onChange,
  onApply,
  onClearAll,
  onClose,
}: TransactionFiltersSheetProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const set = <K extends keyof TxFilterState>(key: K, value: TxFilterState[K]) => {
    onChange({...draft, [key]: value});
  };

  return (
    <Sheet visible={visible} title={t('activity.filters')} onClose={onClose}>
      <ScrollView
        style={{maxHeight: 520}}
        contentContainerStyle={{gap: theme.space[4], paddingBottom: theme.space[4]}}
        keyboardShouldPersistTaps="handled">
        <FilterDateSection draft={draft} onChange={onChange} />

        <FilterChipSection
          label={t('activity.filterType')}
          options={FILTER_TYPES.map(id => ({id, label: typeLabel(id, t)}))}
          selected={draft.type}
          onSelect={id => set('type', id)}
        />

        <FilterChipSection
          label={t('activity.filterSource')}
          options={FILTER_SOURCES.map(id => ({id, label: sourceLabel(id, t)}))}
          selected={draft.source}
          onSelect={id => set('source', id)}
        />

        <FilterEntitySection
          label={t('activity.filterAccount')}
          entities={accounts}
          selectedId={draft.accountId}
          onSelect={id => set('accountId', id)}
        />

        <FilterEntitySection
          label={t('activity.filterCategory')}
          entities={categories}
          selectedId={draft.categoryId}
          onSelect={id => set('categoryId', id)}
        />

        <FilterTagSection
          tags={tags}
          selectedId={draft.tagId}
          onSelect={id => set('tagId', id)}
        />

        <FilterAmountSection
          draft={draft}
          amountCurrencyLabel={amountCurrencyLabel}
          onChange={onChange}
        />

        <View style={{gap: theme.space[2]}}>
          <Button
            label={t('activity.applyFilters')}
            fullWidth
            onPress={onApply}
          />
          <Button
            label={t('activity.clearAll')}
            variant="ghost"
            fullWidth
            onPress={() => {
              onChange({...EMPTY_TX_FILTERS});
              onClearAll();
            }}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}
