import type {RefreshControlProps} from 'react-native';

import type {AppTheme} from '../tokens/createTheme';

/**
 * Theme-aligned RefreshControl colors for ScrollView / FlatList.
 * Pass into `<RefreshControl {...refreshControlTheme(theme)} refreshing onRefresh />`.
 */
export function refreshControlTheme(
  theme: AppTheme,
): Pick<
  RefreshControlProps,
  'tintColor' | 'colors' | 'progressBackgroundColor'
> {
  return {
    tintColor: theme.colors.accent.primary,
    colors: [theme.colors.accent.primary],
    progressBackgroundColor: theme.colors.surface.raised,
  };
}
