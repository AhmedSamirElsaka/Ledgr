import type {ReactNode} from 'react';

import {ScrollView, View, type StyleProp, type ViewStyle} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {useTheme} from '../../../design/theme/ThemeProvider';

type MoreStackChromeProps = {
  children: ReactNode;
  scroll?: boolean;
  washHeight?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: 'handled' | 'always' | 'never';
};

/**
 * Calm backdrop + padding for More stack screens that already have a nav header.
 * Avoids ScreenScaffold's top safe-area inset (which would double with the header).
 */
export function MoreStackChrome({
  children,
  scroll = true,
  washHeight = 220,
  contentContainerStyle,
  keyboardShouldPersistTaps = 'handled',
}: MoreStackChromeProps) {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const paddingStyle: StyleProp<ViewStyle> = [
    {
      flexGrow: scroll ? 1 : undefined,
      flex: scroll ? undefined : 1,
      paddingTop: theme.space[4],
      paddingHorizontal: theme.space[4],
      paddingBottom: insets.bottom + theme.space[8],
      gap: theme.space[4],
    },
    contentContainerStyle,
  ];

  return (
    <ScreenBackdrop washHeight={washHeight}>
      {scroll ? (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={paddingStyle}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{flex: 1}, paddingStyle]}>{children}</View>
      )}
    </ScreenBackdrop>
  );
}
