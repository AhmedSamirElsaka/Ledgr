/**
 * Semantic color palettes — cool mist + deep ledger teal.
 * Feature code: theme.colors.* only — never these hex values in components.
 */

export type ColorTokens = {
  bg: {
    app: string;
    subtle: string;
    mist: string;
  };
  surface: {
    base: string;
    raised: string;
    overlay: string;
    sunken: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
  };
  border: {
    subtle: string;
    default: string;
    strong: string;
    focus: string;
  };
  accent: {
    primary: string;
    primaryPressed: string;
    primaryMuted: string;
    onPrimary: string;
  };
  hero: {
    from: string;
    mid: string;
    to: string;
    text: string;
    muted: string;
    glow: string;
    chip: string;
  };
  semantic: {
    positive: string;
    positiveMuted: string;
    negative: string;
    negativeMuted: string;
    warning: string;
    warningMuted: string;
    info: string;
    infoMuted: string;
  };
  chart: {
    series1: string;
    series2: string;
    series3: string;
    series4: string;
    series5: string;
    series6: string;
    grid: string;
  };
  overlay: {
    scrim: string;
  };
};

/** Light — cool mist neutrals, deep ledger teal accent. */
export const lightColors: ColorTokens = {
  bg: {
    app: '#F1F5F6',
    subtle: '#E8EEF0',
    mist: '#DEE7EA',
  },
  surface: {
    base: '#FFFFFF',
    raised: '#F7FAFB',
    overlay: '#FFFFFF',
    sunken: '#E9F0F2',
  },
  text: {
    primary: '#0A1619',
    secondary: '#5B6B70',
    tertiary: '#84969C',
    inverse: '#F4FFFE',
    disabled: '#A8B8BE',
  },
  border: {
    subtle: '#D5E0E4',
    default: '#B7C6CC',
    strong: '#84969C',
    focus: '#0C7A75',
  },
  accent: {
    primary: '#0C7A75',
    primaryPressed: '#0A6F6A',
    primaryMuted: '#D7F0EE',
    onPrimary: '#FFFFFF',
  },
  hero: {
    from: '#0A6F6A',
    mid: '#0C7A75',
    to: '#0F8F8A',
    text: '#F4FFFE',
    muted: 'rgba(244, 255, 254, 0.72)',
    glow: 'rgba(12, 122, 117, 0.28)',
    chip: 'rgba(244, 255, 254, 0.14)',
  },
  semantic: {
    positive: '#0F8F5B',
    positiveMuted: '#D9F5E8',
    negative: '#C23B3B',
    negativeMuted: '#F8E0E0',
    warning: '#C47A12',
    warningMuted: '#F8EBD3',
    info: '#0C7A75',
    infoMuted: '#D7F0EE',
  },
  chart: {
    series1: '#0C7A75',
    series2: '#2DB5AF',
    series3: '#0A6F6A',
    series4: '#5B6B70',
    series5: '#C47A12',
    series6: '#3A4E56',
    grid: '#D5E0E4',
  },
  overlay: {
    scrim: 'rgba(10, 22, 25, 0.48)',
  },
};

/** Dark — cool ink surfaces, brighter teal accent. */
export const darkColors: ColorTokens = {
  bg: {
    app: '#070D0F',
    subtle: '#0F1C1F',
    mist: '#132226',
  },
  surface: {
    base: '#0F1C1F',
    raised: '#152428',
    overlay: '#1A2C31',
    sunken: '#0A1619',
  },
  text: {
    primary: '#E6F1F3',
    secondary: '#AFC0C6',
    /** Captions/labels on raised surfaces — target ≥4.5:1. */
    tertiary: '#9BB0B6',
    inverse: '#0A1619',
    disabled: '#55656B',
  },
  border: {
    subtle: 'rgba(230, 241, 243, 0.12)',
    default: 'rgba(230, 241, 243, 0.2)',
    strong: '#64767C',
    focus: '#3BC4BD',
  },
  accent: {
    primary: '#2DB5AF',
    primaryPressed: '#249E99',
    primaryMuted: '#143A3A',
    onPrimary: '#04201E',
  },
  hero: {
    from: '#0A4F4C',
    mid: '#0C7A75',
    to: '#2DB5AF',
    text: '#F4FFFE',
    muted: 'rgba(244, 255, 254, 0.7)',
    glow: 'rgba(45, 181, 175, 0.22)',
    chip: 'rgba(244, 255, 254, 0.12)',
  },
  semantic: {
    positive: '#3DDB8A',
    positiveMuted: '#123D2A',
    negative: '#F07171',
    negativeMuted: '#4A1F1F',
    warning: '#E0A53A',
    warningMuted: '#3D2E12',
    info: '#2DB5AF',
    infoMuted: '#143A3A',
  },
  chart: {
    series1: '#2DB5AF',
    series2: '#3BC4BD',
    series3: '#0C7A75',
    series4: '#AFC0C6',
    series5: '#E0A53A',
    series6: '#64767C',
    grid: 'rgba(230, 241, 243, 0.12)',
  },
  overlay: {
    scrim: 'rgba(0, 0, 0, 0.62)',
  },
};
