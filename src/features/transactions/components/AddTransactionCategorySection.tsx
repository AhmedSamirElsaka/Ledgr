import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import {CategoryGrid} from './CategoryGrid';

import type {AccountRow} from '../../../db/repositories/accountsRepository';
import type {CategoryRow} from '../../../db/repositories/categoriesRepository';
import type {TransactionType} from '../../../db/repositories/transactionsRepository';
import type {BudgetHint} from '../hooks/useAddTransactionBudgetHint';

type AddTransactionCategorySectionProps = {
  type: TransactionType;
  accounts: AccountRow[];
  categories: CategoryRow[];
  accountId: string | null;
  toAccountId: string | null;
  categoryId: string | null;
  budgetHint: BudgetHint;
  onToAccountId: (id: string) => void;
  onCategoryId: (id: string) => void;
};

export function AddTransactionCategorySection({
  type,
  accounts,
  categories,
  accountId,
  toAccountId,
  categoryId,
  budgetHint,
  onToAccountId,
  onCategoryId,
}: AddTransactionCategorySectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  if (type === 'transfer') {
    return (
      <>
        <Text variant="label" color="secondary">
          {t('add.toAccount')}
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
          {accounts
            .filter(a => a.id !== accountId)
            .map(acc => (
              <Button
                key={acc.id}
                label={acc.name}
                variant={toAccountId === acc.id ? 'primary' : 'secondary'}
                onPress={() => onToAccountId(acc.id)}
              />
            ))}
        </View>
      </>
    );
  }

  return (
    <>
      <Text variant="label" color="secondary">
        {t('add.category')}
      </Text>
      <CategoryGrid
        categories={categories}
        selectedId={categoryId}
        onSelect={onCategoryId}
      />
      {budgetHint ? (
        <Text
          variant="caption"
          color={budgetHint.overBudget ? 'warning' : 'secondary'}>
          {budgetHint.text}
        </Text>
      ) : null}
    </>
  );
}
