import {ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Pressable} from '../../../design/primitives/Pressable';
import {Sheet} from '../../../design/primitives/Sheet';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {TagRow} from '../../../db/repositories/tagsRepository';

export type BulkTagSheetProps = {
  visible: boolean;
  tags: TagRow[];
  onSelect: (tagId: string) => void;
  onClose: () => void;
};

export function BulkTagSheet({visible, tags, onSelect, onClose}: BulkTagSheetProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  return (
    <Sheet visible={visible} title={t('activity.bulkAddTag')} onClose={onClose}>
      <ScrollView
        style={{maxHeight: 420}}
        contentContainerStyle={{gap: theme.space[2]}}>
        {tags.length === 0 ? (
          <Text variant="body" color="secondary">
            {t('add.bulkNoTags')}
          </Text>
        ) : (
          tags.map(tag => (
            <Pressable
              key={tag.id}
              onPress={() => onSelect(tag.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[3],
                padding: theme.space[3],
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface.sunken,
                borderWidth: 1,
                borderColor: theme.colors.border.subtle,
              }}>
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: theme.radius.full,
                  backgroundColor: tag.color,
                }}
              />
              <Text variant="bodyStrong">{tag.name}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Sheet>
  );
}
