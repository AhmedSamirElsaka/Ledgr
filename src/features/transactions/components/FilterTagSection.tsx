import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import {FilterChipRow} from './FilterChipRow';

import type {TagRow} from '../../../db/repositories/tagsRepository';

type FilterTagSectionProps = {
  tags: TagRow[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function FilterTagSection({tags, selectedId, onSelect}: FilterTagSectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  return (
    <View style={{gap: theme.space[2]}}>
      <Text variant="label" color="secondary">
        {t('activity.filterTag')}
      </Text>
      <FilterChipRow>
        <Pressable
          onPress={() => onSelect(null)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space[2],
            paddingHorizontal: theme.space[3],
            paddingVertical: theme.space[2],
            borderRadius: theme.radius.md,
            backgroundColor:
              selectedId == null
                ? theme.colors.accent.primaryMuted
                : theme.colors.surface.sunken,
            borderWidth: 1,
            borderColor:
              selectedId == null
                ? theme.colors.accent.primary
                : theme.colors.border.subtle,
          }}>
          <Text variant="bodyStrong">{t('activity.any')}</Text>
        </Pressable>
        {tags.map(tag => (
          <Pressable
            key={tag.id}
            onPress={() => onSelect(tag.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space[2],
              paddingHorizontal: theme.space[3],
              paddingVertical: theme.space[2],
              borderRadius: theme.radius.md,
              backgroundColor:
                selectedId === tag.id
                  ? theme.colors.accent.primaryMuted
                  : theme.colors.surface.sunken,
              borderWidth: 1,
              borderColor:
                selectedId === tag.id
                  ? theme.colors.accent.primary
                  : theme.colors.border.subtle,
            }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: theme.radius.full,
                backgroundColor: tag.color,
              }}
            />
            <Text variant="bodyStrong">{tag.name}</Text>
          </Pressable>
        ))}
      </FilterChipRow>
    </View>
  );
}
