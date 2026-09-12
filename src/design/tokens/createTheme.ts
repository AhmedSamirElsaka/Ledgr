import {darkColors, lightColors} from './colors';
import {elevation} from './elevation';
import {motion} from './motion';
import {radius} from './radii';
import {space, touchTarget} from './spacing';
import {fontFamily, typography} from './typography';

import type {ColorTokens} from './colors';

export type ThemeMode = 'light' | 'dark';

export type AppTheme = {
  mode: ThemeMode;
  colors: ColorTokens;
  space: typeof space;
  radius: typeof radius;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  motion: typeof motion;
  elevation: typeof elevation;
  touchTarget: typeof touchTarget;
};

export function createTheme(mode: ThemeMode): AppTheme {
  return {
    mode,
    colors: mode === 'light' ? lightColors : darkColors,
    space,
    radius,
    typography,
    fontFamily,
    motion,
    elevation,
    touchTarget,
  };
}

export const lightTheme = createTheme('light');
export const darkTheme = createTheme('dark');
