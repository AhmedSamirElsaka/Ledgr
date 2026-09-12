import type {ViewStyle} from 'react-native';

/**
 * Soft layered shadows — cool ink tint (#0A1619).
 * Use elevation 1–2 for cards; 3 for floating layers (sheet, dialog).
 */
export const elevation = {
  0: {
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } satisfies ViewStyle,
  1: {
    shadowColor: '#0A1619',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  } satisfies ViewStyle,
  2: {
    shadowColor: '#0A1619',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  } satisfies ViewStyle,
  3: {
    shadowColor: '#0A1619',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  } satisfies ViewStyle,
} as const;

export type ElevationToken = keyof typeof elevation;
