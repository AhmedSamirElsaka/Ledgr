import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {AccessibilityInfo, Appearance, useColorScheme} from 'react-native';

import {createTheme, type AppTheme, type ThemeMode} from '../tokens/createTheme';

export type AppearancePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  theme: AppTheme;
  appearance: AppearancePreference;
  setAppearance: (value: AppearancePreference) => void;
  resolvedMode: ThemeMode;
  reduceMotion: boolean;
  /** Returns 0 when reduce-motion is on; otherwise the requested duration. */
  duration: (ms: number) => number;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: ReactNode;
  initialAppearance?: AppearancePreference;
};

export function ThemeProvider({
  children,
  initialAppearance = 'system',
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [appearance, setAppearance] =
    useState<AppearancePreference>(initialAppearance);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const resolvedMode: ThemeMode = useMemo(() => {
    if (appearance === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return appearance;
  }, [appearance, systemScheme]);

  const theme = useMemo(() => createTheme(resolvedMode), [resolvedMode]);

  const duration = useCallback(
    (ms: number) => (reduceMotion ? 0 : ms),
    [reduceMotion],
  );

  const value = useMemo(
    () => ({
      theme,
      appearance,
      setAppearance,
      resolvedMode,
      reduceMotion,
      duration,
    }),
    [theme, appearance, resolvedMode, reduceMotion, duration],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

/** Sync native Appearance with preference when not following system. */
export function applyNativeAppearance(preference: AppearancePreference): void {
  if (preference === 'system') {
    Appearance.setColorScheme('unspecified');
  } else {
    Appearance.setColorScheme(preference);
  }
}
