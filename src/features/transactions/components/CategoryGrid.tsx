import {View} from 'react-native';

import {isIconName, Icon} from '../../../design/icons/Icon';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {CategoryRow} from '../../../db/repositories/categoriesRepository';

export type CategoryGridProps = {
  categories: CategoryRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function CategoryGrid({categories, selectedId, onSelect}: CategoryGridProps) {
  const {theme} = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.space[2],
      }}>
      {categories.map(cat => {
        const selected = cat.id === selectedId;
        return (
          <Pressable
            key={cat.id}
            accessibilityLabel={cat.name}
            accessibilityState={{selected}}
            onPress={() => onSelect(cat.id)}
            style={{
              width: '31%',
              minHeight: 72,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: selected
                ? theme.colors.accent.primary
                : theme.colors.border.subtle,
              backgroundColor: selected
                ? theme.colors.accent.primaryMuted
                : theme.colors.surface.base,
              alignItems: 'center',
              justifyContent: 'center',
              padding: theme.space[2],
              gap: theme.space[1],
            }}>
            {isIconName(cat.icon) ? (
              <Icon name={cat.icon} size={20} color={cat.color} />
            ) : (
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: theme.radius.full,
                  backgroundColor: cat.color,
                }}
              />
            )}
            <Text variant="caption" align="center" numberOfLines={2}>
              {cat.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
