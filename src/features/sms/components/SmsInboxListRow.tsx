import {memo, useMemo} from 'react';

import {View} from 'react-native';

import {format} from 'date-fns';
import {useTranslation} from 'react-i18next';

import {Icon} from '../../../design/icons/Icon';
import {ListRow} from '../../../design/primitives/ListRow';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {SmsInboxListItem} from '../hooks/useSmsInboxList';

type Props = {
  item: SmsInboxListItem;
  selected?: boolean;
  selectionMode?: boolean;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
};

function SmsInboxListRowInner({
  item,
  selected = false,
  selectionMode = false,
  onPress,
  onLongPress,
}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const when = useMemo(
    () => format(new Date(item.received_at), 'd MMM HH:mm'),
    [item.received_at],
  );
  const ruleLine = item.matchedRuleName
    ? t('smsInbox.matchedRule', {name: item.matchedRuleName})
    : t('smsInbox.noMatchedRule');
  const bodyPreview = useMemo(() => {
    const trimmed = item.body.trim();
    return trimmed.length > 140 ? `${trimmed.slice(0, 137)}…` : trimmed;
  }, [item.body]);

  return (
    <ListRow
      title={item.sender}
      subtitle={`${bodyPreview}\n${when} · ${ruleLine}`}
      icon={selectionMode ? undefined : 'MessageSquare'}
      leading={
        selectionMode ? (
          <View
            style={{
              width: theme.touchTarget,
              height: theme.touchTarget,
              borderRadius: theme.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: selected
                ? theme.colors.accent.primary
                : theme.colors.border.subtle,
              backgroundColor: selected
                ? theme.colors.accent.primaryMuted
                : theme.colors.surface.raised,
            }}>
            {selected ? (
              <Icon name="Check" size={18} color={theme.colors.accent.primary} />
            ) : null}
          </View>
        ) : undefined
      }
      showDisclosure={!selectionMode}
      onPress={() => onPress(item.id)}
      onLongPress={onLongPress ? () => onLongPress(item.id) : undefined}
      accessibilityLabel={
        selectionMode
          ? t('smsInbox.selectItemA11y', {
              sender: item.sender,
              state: selected ? t('smsInbox.selectedState') : t('smsInbox.unselectedState'),
            })
          : t('smsInbox.reviewItemA11y', {sender: item.sender})
      }
    />
  );
}

export const SmsInboxListRow = memo(SmsInboxListRowInner);
