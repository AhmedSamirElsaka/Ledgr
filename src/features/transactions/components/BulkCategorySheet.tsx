import {ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Pressable} from '../../../design/primitives/Pressable';
import {Sheet} from '../../../design/primitives/Sheet';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {CategoryRow} from '../../../db/repositories/categoriesRepository';

export type BulkCategorySheetProps = {
  visible: boolean;
  categories: CategoryRow[];
  onSelect: (categoryId: string) => void;
  onClose: () => void;
};

export function BulkCategorySheet({
  visible,
  categories,
  onSelect,
  onClose,
}: BulkCategorySheetProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  return (
    <Sheet visible={visible} title={t('add.bulkRecategorize')} onClose={onClose}>
      <ScrollView
        style={{maxHeight: 420}}
        contentContainerStyle={{gap: theme.space[2]}}>
        {categories.length === 0 ? (
          <Text variant="body" color="secondary">
            {t('add.bulkNoCategories')}
          </Text>
        ) : (
          categories.map(cat => (
            <Pressable
              key={cat.id}
              onPress={() => onSelect(cat.id)}
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
                  backgroundColor: cat.color,
                }}
              />
              <Text variant="bodyStrong">{cat.name}</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Sheet>
  );
}
