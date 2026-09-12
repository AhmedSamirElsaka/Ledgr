import {useMemo} from 'react';

import {ScrollView, View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {isIconName, Icon} from '../../../design/icons/Icon';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {CategoryRow} from '../../../db/repositories/categoriesRepository';
import type {SmsCategorySuggestion} from '../hooks/useSmsQuickReviewLoad';

type Props = {
  leafCategories: CategoryRow[];
  categoryId: string | null;
  onCategoryChange: (id: string) => void;
  categorySuggestion?: SmsCategorySuggestion | null;
  limit?: number;
};

export function SmsQuickReviewCategoryPicker({
  leafCategories,
  categoryId,
  onCategoryChange,
  categorySuggestion = null,
  limit = 8,
}: Props) {
  const {t} = useTranslation();
  const {theme} = useTheme();

  const topCategories = useMemo(() => {
    if (categoryId) {
      const selected = leafCategories.find(c => c.id === categoryId);
      const rest = leafCategories.filter(c => c.id !== categoryId);
      return selected ? [selected, ...rest].slice(0, limit) : leafCategories.slice(0, limit);
    }
    return leafCategories.slice(0, limit);
  }, [categoryId, leafCategories, limit]);

  return (
    <View style={{gap: theme.space[2]}}>
      <Text variant="label" color="secondary">
        {t('smsReview.category')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: theme.space[2],
          paddingVertical: theme.space[1],
        }}>
        {topCategories.map(cat => {
          const selected = categoryId === cat.id;
          return (
            <Pressable
              key={cat.id}
              accessibilityLabel={cat.name}
              accessibilityState={{selected}}
              minSize={false}
              onPress={() => onCategoryChange(cat.id)}
              style={{
                minHeight: theme.touchTarget,
                paddingHorizontal: theme.space[3],
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[2],
                borderRadius: theme.radius.full,
                backgroundColor: selected
                  ? theme.colors.accent.primary
                  : theme.colors.surface.raised,
                borderWidth: 1,
                borderColor: selected
                  ? theme.colors.accent.primary
                  : theme.colors.border.subtle,
              }}>
              {isIconName(cat.icon) ? (
                <Icon
                  name={cat.icon}
                  size={16}
                  color={selected ? theme.colors.accent.onPrimary : cat.color}
                />
              ) : null}
              <Text variant="bodyStrong" color={selected ? 'inverse' : 'primary'}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {categorySuggestion?.source === 'history' ? (
        <Text variant="caption" color="tertiary">
          {t('smsReview.confidenceHistory', {
            count: categorySuggestion.hitCount ?? 0,
          })}
        </Text>
      ) : null}
      {categorySuggestion?.source === 'memory' ? (
        <Text variant="caption" color="tertiary">
          {t('smsReview.confidenceMemory')}
        </Text>
      ) : null}
      {categorySuggestion?.source === 'keyword' ? (
        <Text variant="caption" color="tertiary">
          {t('smsReview.confidenceKeyword')}
        </Text>
      ) : null}
    </View>
  );
}
