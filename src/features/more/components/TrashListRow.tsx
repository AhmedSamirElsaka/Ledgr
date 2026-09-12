import {View} from 'react-native';

import {differenceInCalendarDays, parseISO} from 'date-fns';
import {useTranslation} from 'react-i18next';

import {Amount} from '../../../design/primitives/Amount';
import {Button} from '../../../design/primitives/Button';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {isCurrencyCode, money, type CurrencyCode} from '../../../domain/money/Money';
import {formatDate} from '../../../i18n/formatDate';
import {TRASH_WINDOW_DAYS} from '../hooks/useTrashScreen';

import type {TransactionRow} from '../../../db/repositories/transactionsRepository';

function asCurrency(code: string): CurrencyCode {
  return isCurrencyCode(code) ? code : 'EGP';
}

function daysLeftInTrash(deletedAt: string): number {
  const deleted = parseISO(deletedAt);
  const expires = new Date(deleted);
  expires.setUTCDate(expires.getUTCDate() + TRASH_WINDOW_DAYS);
  return Math.max(0, differenceInCalendarDays(expires, new Date()));
}

function txSignedMinor(tx: TransactionRow): number {
  if (tx.type === 'expense') {
    return -Math.abs(tx.base_amount_minor);
  }
  if (tx.type === 'income') {
    return Math.abs(tx.base_amount_minor);
  }
  return tx.base_amount_minor;
}

type TrashListRowProps = {
  item: TransactionRow;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
};

export function TrashListRow({item, onRestore, onPermanentDelete}: TrashListRowProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const daysLeft = item.deleted_at ? daysLeftInTrash(item.deleted_at) : 0;
  const daysLeftLabel =
    daysLeft === 0
      ? t('trashScreen.expiresToday')
      : t('trashScreen.daysLeft', {count: daysLeft});

  return (
    <View
      style={{
        minHeight: 64,
        gap: theme.space[3],
        paddingHorizontal: theme.space[4],
        paddingVertical: theme.space[3],
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        backgroundColor: theme.colors.surface.raised,
        ...theme.elevation[1],
      }}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', gap: theme.space[2]}}>
        <Text variant="bodyStrong" style={{flex: 1}}>
          {item.merchant ?? item.note ?? item.type}
        </Text>
        <Amount
          value={money(txSignedMinor(item), asCurrency(item.currency))}
          size="sm"
          signed={item.type === 'income' || item.type === 'expense'}
          tone={
            item.type === 'expense'
              ? 'expense'
              : item.type === 'income'
                ? 'income'
                : 'default'
          }
        />
      </View>
      <Text variant="caption" color="tertiary">
        {formatDate(item.occurred_at, 'd MMM yyyy')}
        {item.deleted_at
          ? ` · ${t('trashScreen.deletedOn', {
              date: formatDate(parseISO(item.deleted_at), 'd MMM'),
            })}`
          : ''}
        {' · '}
        {daysLeftLabel}
      </Text>
      <View style={{flexDirection: 'row', gap: theme.space[2]}}>
        <View style={{flex: 1}}>
          <Button
            label={t('trashScreen.restore')}
            variant="secondary"
            fullWidth
            onPress={() => onRestore(item.id)}
          />
        </View>
        <View style={{flex: 1}}>
          <Button
            label={t('trashScreen.deleteForever')}
            variant="danger"
            fullWidth
            onPress={() => onPermanentDelete(item.id)}
          />
        </View>
      </View>
    </View>
  );
}
