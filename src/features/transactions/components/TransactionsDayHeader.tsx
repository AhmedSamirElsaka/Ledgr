import {memo} from 'react';

import {View} from 'react-native';

import {parseISO} from 'date-fns';

import {Amount} from '../../../design/primitives/Amount';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {money, type CurrencyCode} from '../../../domain/money/Money';
import {formatDate} from '../../../i18n/formatDate';

import {ITEM_GAP} from './transactionListConstants';

import type {DayGroup} from '../../../domain/transactions/groupByDay';

export const HEADER_HEIGHT = 48;

export type TransactionsDayHeaderProps = {
  group: DayGroup;
  baseCurrency: CurrencyCode;
};

function TransactionsDayHeaderInner({
  group,
  baseCurrency,
}: TransactionsDayHeaderProps) {
  const {theme} = useTheme();
  const dayLabel = formatDate(parseISO(group.dayKey), 'EEE, d MMM yyyy');

  return (
    <View
      style={{
        height: HEADER_HEIGHT,
        marginBottom: ITEM_GAP,
        paddingTop: theme.space[3],
        paddingBottom: theme.space[1],
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: theme.space[3],
      }}>
      <Text
        variant="label"
        color="tertiary"
        numberOfLines={1}
        style={{flex: 1, textTransform: 'uppercase'}}>
        {dayLabel}
      </Text>
      <Amount
        value={money(group.totalBaseMinor, baseCurrency)}
        size="sm"
        tone="muted"
      />
    </View>
  );
}

export const TransactionsDayHeader = memo(TransactionsDayHeaderInner);
