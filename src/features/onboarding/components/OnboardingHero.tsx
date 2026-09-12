import {Image, View} from 'react-native';

import hero from '../../../../assets/brand/onboarding-hero.png';
import {useTheme} from '../../../design/theme/ThemeProvider';

/** Brand hero for onboarding — calm fintech illustration. */
export function OnboardingHero() {
  const {theme} = useTheme();

  return (
    <View
      accessible={false}
      style={{
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        backgroundColor: theme.colors.surface.sunken,
        ...theme.elevation[2],
      }}>
      <Image
        source={hero}
        resizeMode="cover"
        style={{
          width: '100%',
          height: 180,
        }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
