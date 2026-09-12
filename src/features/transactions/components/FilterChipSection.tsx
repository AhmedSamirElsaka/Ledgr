import {View} from 'react-native';

import {Button} from '../../../design/primitives/Button';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import {FilterChipRow} from './FilterChipRow';

type ChipOption<T> = {id: T; label: string};

type FilterChipSectionProps<T> = {
  label: string;
  options: readonly ChipOption<T>[];
  selected: T;
  onSelect: (id: T) => void;
  keyFn?: (option: ChipOption<T>) => string;
};

export function FilterChipSection<T>({
  label,
  options,
  selected,
  onSelect,
  keyFn = option => String(option.label),
}: FilterChipSectionProps<T>) {
  const {theme} = useTheme();

  return (
    <View style={{gap: theme.space[2]}}>
      <Text variant="label" color="secondary">
        {label}
      </Text>
      <FilterChipRow>
        {options.map(option => (
          <Button
            key={keyFn(option)}
            label={option.label}
            variant={selected === option.id ? 'primary' : 'secondary'}
            onPress={() => onSelect(option.id)}
          />
        ))}
      </FilterChipRow>
    </View>
  );
}
