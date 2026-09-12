import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Button} from '../../../design/primitives/Button';
import {Input} from '../../../design/primitives/Input';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {TagRow} from '../../../db/repositories/tagsRepository';

type AddTransactionTagsSectionProps = {
  tags: TagRow[];
  selectedTagIds: readonly string[];
  newTagName: string;
  onToggleTag: (id: string) => void;
  onNewTagName: (name: string) => void;
  onCreateTag: () => void;
};

export function AddTransactionTagsSection({
  tags,
  selectedTagIds,
  newTagName,
  onToggleTag,
  onNewTagName,
  onCreateTag,
}: AddTransactionTagsSectionProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const selected = new Set(selectedTagIds);

  return (
    <>
      <Text variant="label" color="secondary">
        {t('add.tags')}
      </Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.space[2]}}>
        {tags.map(tag => {
          const isOn = selected.has(tag.id);
          return (
            <Pressable
              key={tag.id}
              accessibilityLabel={t('add.tagA11y', {name: tag.name})}
              accessibilityState={{selected: isOn}}
              onPress={() => onToggleTag(tag.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[2],
                paddingVertical: theme.space[2],
                paddingHorizontal: theme.space[3],
                borderRadius: theme.radius.full,
                backgroundColor: isOn
                  ? theme.colors.accent.primaryMuted
                  : theme.colors.surface.sunken,
                borderWidth: 1,
                borderColor: isOn
                  ? theme.colors.accent.primary
                  : theme.colors.border.subtle,
              }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: theme.radius.full,
                  backgroundColor: tag.color,
                }}
              />
              <Text variant="caption" color={isOn ? 'accent' : 'primary'}>
                {tag.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{flexDirection: 'row', gap: theme.space[2], alignItems: 'flex-end'}}>
        <View style={{flex: 1}}>
          <Input
            label={t('add.newTag')}
            value={newTagName}
            onChangeText={onNewTagName}
            placeholder={t('add.newTagPlaceholder')}
          />
        </View>
        <Button
          label={t('common.add')}
          variant="secondary"
          disabled={!newTagName.trim()}
          onPress={onCreateTag}
        />
      </View>
    </>
  );
}
