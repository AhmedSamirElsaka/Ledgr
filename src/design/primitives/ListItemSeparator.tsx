import {View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

/** Reliable FlashList row gap — prefer over contentContainerStyle `gap`. */
export function ListItemSeparator() {
  const {theme} = useTheme();
  return <View style={{height: theme.space[3]}} />;
}
