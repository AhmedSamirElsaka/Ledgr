import type {ReactNode} from 'react';

import {StyleSheet} from 'react-native';

import {BottomSheetModalProvider} from '@gorhom/bottom-sheet';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {DatabaseProvider} from '../db/DatabaseProvider';
import {ThemeProvider, useTheme} from '../design/theme/ThemeProvider';
import '../i18n';

import {AppErrorBoundary} from './AppErrorBoundary';

function NavigationShell({children}: {children: ReactNode}) {
  const {theme, resolvedMode} = useTheme();
  const navTheme = {
    ...(resolvedMode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(resolvedMode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.colors.bg.app,
      card: theme.colors.surface.base,
      text: theme.colors.text.primary,
      border: theme.colors.border.subtle,
      primary: theme.colors.accent.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
    </NavigationContainer>
  );
}

export function AppProviders({children}: {children: ReactNode}) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider initialAppearance="system">
          <AppErrorBoundary>
            <DatabaseProvider>
              <NavigationShell>{children}</NavigationShell>
            </DatabaseProvider>
          </AppErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
});
