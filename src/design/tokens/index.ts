/**
 * Ledgr design tokens — single entry for color, space, type, radii, motion, currency.
 * Prefer `useTheme().theme` in components; import from here only in theme construction / tests.
 */

export {lightColors, darkColors, type ColorTokens} from './colors';
export {space, touchTarget, type SpaceToken} from './spacing';
export {radius, type RadiusToken} from './radii';
export {fontFamily, fontSize, fontWeight, letterSpacing, typography, type TypographyVariant} from './typography';
export {motion, duration, easing, spring} from './motion';
export {elevation, type ElevationToken} from './elevation';
export {createTheme, lightTheme, darkTheme, type AppTheme, type ThemeMode} from './createTheme';
export {
  EGP_FORMAT,
  formatEgpRules,
  type EgPFormatRules,
} from './currency';
