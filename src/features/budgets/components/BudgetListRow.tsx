import {memo} from 'react';

import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {AnimatedProgressBar} from '../../../design/motion/AnimatedProgressBar';
import {Amount} from '../../../design/primitives/Amount';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {isCurrencyCode, money, type CurrencyCode} from '../../../domain/money/Money';

import type {BudgetPeriod} from '../../../db/repositories/budgetsRepository';
import type {BudgetListItem} from '../hooks/useBudgetsScreen';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

function periodLabel(period: BudgetPeriod, t: (key: string) => string): string {
  if (period === 'weekly') {
    return t('budgetForm.periodWeekly');
  }
  if (period === 'monthly') {
    return t('budgetForm.periodMonthly');
  }
  return t('budgetForm.periodCustom');
}

type BudgetListRowProps = {
  item: BudgetListItem;
  onPress: (id: string) => void;
};

function BudgetListRowInner({item, onPress}: BudgetListRowProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const cur = asCurrency(item.budget.currency);
  const percent = Math.round(item.progress * 100);

  return (
    <Pressable
      onPress={() => onPress(item.budget.id)}
      accessibilityLabel={t('budgetsScreen.rowA11y', {
        name: item.categoryName,
        percent,
      })}
      style={{
        marginBottom: theme.space[3],
        backgroundColor: theme.colors.surface.raised,
        borderRadius: theme.radius.lg,
        padding: theme.space[4],
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        gap: theme.space[2],
        ...theme.elevation[1],
      }}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Text variant="bodyStrong">{item.categoryName}</Text>
        <Text variant="caption" color="tertiary">
          {periodLabel(item.budget.period, t)}
        </Text>
      </View>
      <AnimatedProgressBar
        progress={item.progress}
        overBudget={item.overBudget}
        accessibilityLabel={t('budgetsScreen.progressA11y', {
          name: item.categoryName,
        })}
      />
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <Amount
          value={money(item.remainingMinor, cur)}
          size="sm"
          signed={item.overBudget || item.remainingMinor < 0}
          tone={item.overBudget ? 'expense' : 'muted'}
        />
        <Amount value={money(item.budget.amount_minor, cur)} size="sm" tone="muted" />
      </View>
    </Pressable>
  );
}

export const BudgetListRow = memo(BudgetListRowInner);
