import type {ReactNode} from 'react';

import {View} from 'react-native';

import {useTheme} from '../../../design/theme/ThemeProvider';

export function FilterChipRow({children}: {children: ReactNode}) {
  const {theme} = useTheme();
  return (
    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
      {children}
    </View>
  );
}
