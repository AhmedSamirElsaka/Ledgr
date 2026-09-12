import {memo, useMemo} from 'react';

import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Icon} from '../../../design/icons/Icon';
import {Amount} from '../../../design/primitives/Amount';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {money, type CurrencyCode} from '../../../domain/money/Money';
import {
  buildTransactionRowMeta,
  transactionRowTitle,
} from '../hooks/transactionRowMeta';

import {ITEM_GAP, ROW_HEIGHT} from './transactionListConstants';

import type {TransactionRow} from '../../../db/repositories/transactionsRepository';

export type TransactionRowContentProps = {
  tx: TransactionRow;
  currency: CurrencyCode;
  tagNames?: readonly string[];
  selected: boolean;
  selectionMode: boolean;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
};

function TransactionRowContentInner({
  tx,
  currency,
  tagNames = [],
  selected,
  selectionMode,
  onPress,
  onLongPress,
}: TransactionRowContentProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const labels = useMemo(
    () => ({
      typeExpense: t('activity.typeExpense'),
      typeIncome: t('activity.typeIncome'),
      typeTransfer: t('activity.typeTransfer'),
      sourceSms: t('activity.sourceSms'),
      sourceRecurring: t('activity.sourceRecurring'),
      sourceImport: t('activity.sourceImport'),
    }),
    [t],
  );

  const signed =
    tx.type === 'expense'
      ? -Math.abs(tx.amount_minor)
      : tx.type === 'income'
        ? Math.abs(tx.amount_minor)
        : tx.amount_minor;

  const title = transactionRowTitle(tx, labels);
  const meta = buildTransactionRowMeta(tx, tagNames, labels);

  return (
    <Pressable
      onPress={() => onPress(tx.id)}
      onLongPress={() => onLongPress(tx.id)}
      delayLongPress={350}
      accessibilityState={{selected}}
      accessibilityLabel={`${title}, ${meta}`}
      style={{
        height: ROW_HEIGHT,
        marginBottom: ITEM_GAP,
        backgroundColor: selected
          ? theme.colors.accent.primaryMuted
          : theme.colors.surface.raised,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.space[4],
        paddingVertical: theme.space[3],
        borderWidth: 1,
        borderColor: selected
          ? theme.colors.accent.primary
          : theme.colors.border.subtle,
        justifyContent: 'center',
        ...(selected ? theme.elevation[2] : theme.elevation[1]),
      }}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.space[3]}}>
        {selectionMode ? (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: theme.radius.full,
              borderWidth: 2,
              borderColor: selected
                ? theme.colors.accent.primary
                : theme.colors.border.default,
              backgroundColor: selected
                ? theme.colors.accent.primary
                : theme.colors.surface.raised,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {selected ? (
              <Icon name="Check" size={14} color={theme.colors.text.inverse} />
            ) : null}
          </View>
        ) : null}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface.sunken,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon
            name={
              tx.type === 'income'
                ? 'TrendingUp'
                : tx.type === 'transfer'
                  ? 'ArrowLeftRight'
                  : 'Receipt'
            }
            size={18}
            color={
              tx.type === 'income'
                ? theme.colors.semantic.positive
                : tx.type === 'transfer'
                  ? theme.colors.text.secondary
                  : theme.colors.semantic.negative
            }
          />
        </View>
        <View style={{flex: 1, gap: theme.space[1], paddingRight: theme.space[2]}}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="caption" color="tertiary" numberOfLines={1}>
            {meta}
          </Text>
        </View>
        <Amount
          value={money(signed, currency)}
          size="sm"
          signed={tx.type === 'income' || tx.type === 'expense'}
          tone={
            tx.type === 'expense'
              ? 'expense'
              : tx.type === 'income'
                ? 'income'
                : 'default'
          }
        />
      </View>
    </Pressable>
  );
}

export const TransactionRowContent = memo(TransactionRowContentInner);
