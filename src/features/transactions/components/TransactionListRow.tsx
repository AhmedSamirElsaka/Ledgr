import {memo, useEffect, useRef} from 'react';

import {View} from 'react-native';

import {useTranslation} from 'react-i18next';
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import {useTheme} from '../../../design/theme/ThemeProvider';
import {type CurrencyCode} from '../../../domain/money/Money';
import {useIsRtl} from '../../../i18n/useTextInputAlign';

import {TransactionRowContent} from './TransactionRowContent';
import {TransactionSwipeAction} from './TransactionSwipeAction';

import type {TransactionRow} from '../../../db/repositories/transactionsRepository';

export {ITEM_GAP, ROW_HEIGHT} from './transactionListConstants';

export type TransactionListRowProps = {
  tx: TransactionRow;
  currency: CurrencyCode;
  tagNames?: readonly string[];
  selected: boolean;
  selectionMode: boolean;
  swipeEnabled: boolean;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSwipeableOpen: (ref: SwipeableMethods) => void;
};

function TransactionListRowInner({
  tx,
  currency,
  tagNames,
  selected,
  selectionMode,
  swipeEnabled,
  onPress,
  onLongPress,
  onEdit,
  onDelete,
  onSwipeableOpen,
}: TransactionListRowProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const isRtl = useIsRtl();
  const swipeRef = useRef<SwipeableMethods | null>(null);

  useEffect(() => {
    swipeRef.current?.close();
  }, [tx.id]);

  const close = () => swipeRef.current?.close();

  const editAction = (
    <View
      style={
        isRtl
          ? {flexDirection: 'row', marginLeft: theme.space[2]}
          : {flexDirection: 'row', marginRight: theme.space[2]}
      }>
      <TransactionSwipeAction
        label={t('common.edit')}
        backgroundColor={theme.colors.accent.primary}
        icon="Pencil"
        onAction={() => {
          close();
          onEdit(tx.id);
        }}
      />
    </View>
  );

  const isSms = tx.source === 'sms';
  const deleteAction = (
    <View
      style={
        isRtl
          ? {flexDirection: 'row', marginRight: theme.space[2]}
          : {flexDirection: 'row', marginLeft: theme.space[2]}
      }>
      <TransactionSwipeAction
        label={isSms ? t('activity.reject') : t('common.delete')}
        backgroundColor={theme.colors.semantic.negative}
        icon={isSms ? 'Ban' : 'Trash2'}
        onAction={() => {
          close();
          onDelete(tx.id);
        }}
      />
    </View>
  );

  const row = (
    <TransactionRowContent
      tx={tx}
      currency={currency}
      tagNames={tagNames}
      selected={selected}
      selectionMode={selectionMode}
      onPress={onPress}
      onLongPress={onLongPress}
    />
  );

  if (!swipeEnabled) {
    return row;
  }

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      overshootFriction={8}
      enabled={swipeEnabled}
      onSwipeableWillOpen={() => {
        if (swipeRef.current) {
          onSwipeableOpen(swipeRef.current);
        }
      }}
      renderLeftActions={() => (isRtl ? deleteAction : editAction)}
      renderRightActions={() => (isRtl ? editAction : deleteAction)}>
      {row}
    </Swipeable>
  );
}

export const TransactionListRow = memo(TransactionListRowInner);
