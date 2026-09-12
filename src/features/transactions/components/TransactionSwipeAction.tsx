import {Icon} from '../../../design/icons/Icon';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import {ITEM_GAP} from './transactionListConstants';

type TransactionSwipeActionProps = {
  label: string;
  backgroundColor: string;
  icon: 'Pencil' | 'Trash2' | 'Ban';
  onAction: () => void;
};

export function TransactionSwipeAction({
  label,
  backgroundColor,
  icon,
  onAction,
}: TransactionSwipeActionProps) {
  const {theme} = useTheme();

  return (
    <Pressable
      onPress={onAction}
      accessibilityLabel={label}
      style={{
        width: 76,
        marginBottom: ITEM_GAP,
        backgroundColor,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: theme.radius.lg,
        gap: theme.space[1],
      }}>
      <Icon name={icon} color={theme.colors.text.inverse} size={20} />
      <Text variant="caption" color="inverse">
        {label}
      </Text>
    </Pressable>
  );
}
