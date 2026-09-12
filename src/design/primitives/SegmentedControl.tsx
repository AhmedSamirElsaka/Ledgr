import {ScrollView, View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

import {Pressable} from './Pressable';
import {Text} from './Text';

export type SegmentOption<T extends string> = {
  id: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: Array<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
};

/**
 * Compact period / filter control — one selected pill in a soft track.
 * Prefer this over a wrap of full Button chips for density and polish.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel = 'Period',
}: SegmentedControlProps<T>) {
  const {theme} = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={{
        paddingVertical: theme.space[1],
        gap: theme.space[1],
        backgroundColor: theme.colors.surface.sunken,
        borderRadius: theme.radius.full,
        paddingHorizontal: theme.space[1],
      }}
      style={{flexGrow: 0}}>
      {options.map(option => {
        const selected = option.id === value;
        return (
          <Pressable
            key={option.id}
            accessibilityLabel={option.label}
            accessibilityState={{selected}}
            minSize={false}
            onPress={() => onChange(option.id)}
            style={{
              minHeight: 36,
              paddingHorizontal: theme.space[3],
              justifyContent: 'center',
              borderRadius: theme.radius.full,
              backgroundColor: selected
                ? theme.colors.surface.raised
                : 'transparent',
              ...(selected ? theme.elevation[1] : null),
            }}>
            <Text
              variant="caption"
              color={selected ? 'primary' : 'secondary'}
              style={{fontWeight: selected ? '600' : '500'}}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
      <View style={{width: theme.space[1]}} />
    </ScrollView>
  );
}
