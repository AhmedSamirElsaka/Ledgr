import {StyleSheet, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import {Icon} from '../../design/icons/Icon';
import {Pressable} from '../../design/primitives/Pressable';
import {useTheme} from '../../design/theme/ThemeProvider';
import {useIsRtl} from '../../i18n/useTextInputAlign';

import type {AppTheme} from '../../design/tokens/createTheme';
import type {NativeStackNavigationOptions} from '@react-navigation/native-stack';

/** Explicit back control — always visible when the stack can go back (EN + RTL). */
export function StackHeaderBackButton() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {theme} = useTheme();
  const isRtl = useIsRtl();

  if (!navigation.canGoBack()) {
    return <View style={{width: theme.touchTarget}} />;
  }

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      accessibilityLabel={t('common.back')}
      accessibilityRole="button"
      hitSlop={8}
      style={{
        minWidth: theme.touchTarget,
        minHeight: theme.touchTarget,
        alignItems: 'center',
        justifyContent: 'center',
        marginStart: theme.space[1],
      }}>
      <Icon
        name={isRtl ? 'ChevronRight' : 'ChevronLeft'}
        size={24}
        color={theme.colors.accent.primary}
      />
    </Pressable>
  );
}

function StackHeaderBackground({theme}: {theme: AppTheme}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface.raised,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border.subtle,
      }}
    />
  );
}

type ThemedStackOptionsArgs = {
  theme: AppTheme;
  /** When true, screens show the themed header by default. */
  headerShown?: boolean;
};

/** Shared premium native-stack header for nested More / form screens. */
export function createThemedStackOptions({
  theme,
  headerShown = true,
}: ThemedStackOptionsArgs): NativeStackNavigationOptions {
  return {
    headerShown,
    headerShadowVisible: false,
    headerBackVisible: false,
    headerTitleAlign: 'center',
    animation: 'slide_from_right',
    freezeOnBlur: true,
    contentStyle: {
      backgroundColor: theme.colors.bg.app,
    },
    headerStyle: {
      backgroundColor: theme.colors.surface.raised,
    },
    headerBackground: () => <StackHeaderBackground theme={theme} />,
    headerTintColor: theme.colors.accent.primary,
    headerTitleStyle: {
      ...theme.typography.bodyStrong,
      color: theme.colors.text.primary,
    },
    headerLeft: () => <StackHeaderBackButton />,
  };
}
