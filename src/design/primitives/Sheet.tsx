import type {ReactNode} from 'react';

import {Modal, View, type StyleProp, type ViewStyle} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

import {IconButton} from './IconButton';
import {Text} from './Text';

/**
 * Lightweight sheet shell until @gorhom/bottom-sheet is wired in navigation phase.
 * Same visual language; swap implementation later without changing call sites much.
 */
export type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Sheet({visible, title, onClose, children, style}: SheetProps) {
  const {theme} = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: theme.colors.overlay.scrim,
        }}>
        <View
          style={[
            {
              backgroundColor: theme.colors.surface.overlay,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              paddingHorizontal: theme.space[4],
              paddingTop: theme.space[3],
              paddingBottom: theme.space[8],
              maxHeight: '85%',
              ...theme.elevation[3],
            },
            style,
          ]}>
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.border.default,
              marginBottom: theme.space[3],
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: theme.space[4],
            }}>
            <Text variant="headline">{title}</Text>
            <IconButton name="X" onPress={onClose} accessibilityLabel="Close sheet" />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
