import type {ReactNode} from 'react';

import {
  RefreshControl,
  ScrollView,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useTheme} from '../theme/ThemeProvider';

import {refreshControlTheme} from './refreshControl';
import {ScreenBackdrop} from './ScreenBackdrop';
import {SectionHeader} from './SectionHeader';

export type ScreenScaffoldProps = {
  children: ReactNode;
  title?: string;
  eyebrow?: string;
  description?: string;
  trailing?: ReactNode;
  /** Extra content below the title block (chips, filters, banners). */
  header?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  washHeight?: number;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  refreshing?: boolean;
  onRefresh?: () => void;
  testID?: string;
};

/**
 * Calm-premium screen chrome: mist wash, safe-area padding, optional header,
 * and themed pull-to-refresh when `onRefresh` is provided.
 */
export function ScreenScaffold({
  children,
  title,
  eyebrow,
  description,
  trailing,
  header,
  footer,
  scroll = true,
  washHeight = 280,
  contentContainerStyle,
  style,
  keyboardShouldPersistTaps = 'handled',
  refreshing = false,
  onRefresh,
  testID,
}: ScreenScaffoldProps) {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <>
      {title ? (
        <SectionHeader
          title={title}
          eyebrow={eyebrow}
          description={description}
          trailing={trailing}
          size="screen"
        />
      ) : null}
      {header}
      {children}
      {footer}
    </>
  );

  const layoutStyle: StyleProp<ViewStyle> = [
    {
      flexGrow: scroll ? 1 : undefined,
      flex: scroll ? undefined : 1,
      paddingTop: insets.top + theme.space[5],
      paddingHorizontal: theme.space[4],
      paddingBottom: insets.bottom + theme.space[8],
      gap: theme.space[5],
    },
    contentContainerStyle,
  ];

  return (
    <ScreenBackdrop washHeight={washHeight} style={style} testID={testID}>
      {scroll ? (
        <ScrollView
          style={{flex: 1}}
          contentContainerStyle={layoutStyle}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                {...refreshControlTheme(theme)}
              />
            ) : undefined
          }>
          {content}
        </ScrollView>
      ) : (
        <View style={layoutStyle}>{content}</View>
      )}
    </ScreenBackdrop>
  );
}
