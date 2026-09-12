import {View} from 'react-native';

import {useTranslation} from 'react-i18next';

import {Icon} from '../../../design/icons/Icon';
import {Button} from '../../../design/primitives/Button';
import {Input} from '../../../design/primitives/Input';
import {Pressable} from '../../../design/primitives/Pressable';
import {Text} from '../../../design/primitives/Text';
import {useTheme} from '../../../design/theme/ThemeProvider';

export type TransactionsHeaderProps = {
  topInset: number;
  selectionMode: boolean;
  selectedCount: number;
  searchQuery: string;
  activeFilterCount: number;
  onSearchChange: (query: string) => void;
  onExitSelection: () => void;
  onOpenFilters: () => void;
  onClearAllFilters: () => void;
};

export function TransactionsHeader({
  topInset,
  selectionMode,
  selectedCount,
  searchQuery,
  activeFilterCount,
  onSearchChange,
  onExitSelection,
  onOpenFilters,
  onClearAllFilters,
}: TransactionsHeaderProps) {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const filtersActive = activeFilterCount > 0;

  return (
    <View
      style={{
        paddingTop: topInset + theme.space[5],
        paddingHorizontal: theme.space[4],
        paddingBottom: theme.space[3],
        gap: theme.space[4],
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: theme.space[3],
        }}>
        <View style={{flex: 1, gap: theme.space[1]}}>
          <Text variant="label" color="tertiary">
            {t('activity.eyebrow')}
          </Text>
          <Text variant="title">{t('activity.title')}</Text>
          {selectionMode ? (
            <Text variant="caption" color="secondary">
              {t('activity.selected', {count: selectedCount})}
            </Text>
          ) : null}
        </View>
        {selectionMode ? (
          <Button
            label={t('activity.exitSelection')}
            variant="ghost"
            onPress={onExitSelection}
          />
        ) : null}
      </View>

      {selectionMode ? null : (
        <View style={{gap: theme.space[3]}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space[2],
              minHeight: theme.touchTarget,
              paddingHorizontal: theme.space[3],
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
              backgroundColor: theme.colors.surface.base,
            }}>
            <Icon
              name="Search"
              size={18}
              color={theme.colors.text.tertiary}
            />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChangeText={onSearchChange}
              accessibilityLabel={t('common.search')}
              returnKeyType="search"
              clearButtonMode="while-editing"
              containerStyle={{flex: 1, gap: 0}}
              style={{
                flex: 1,
                borderWidth: 0,
                borderRadius: 0,
                backgroundColor: 'transparent',
                minHeight: theme.touchTarget,
                paddingHorizontal: theme.space[1],
                paddingVertical: theme.space[2],
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space[2],
              flexWrap: 'wrap',
            }}>
            <Pressable
              onPress={onOpenFilters}
              accessibilityLabel={
                filtersActive
                  ? t('activity.filtersCount', {count: activeFilterCount})
                  : t('activity.filters')
              }
              accessibilityState={{selected: filtersActive}}
              minSize={false}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space[2],
                minHeight: theme.touchTarget,
                paddingHorizontal: theme.space[3],
                borderRadius: theme.radius.full,
                backgroundColor: filtersActive
                  ? theme.colors.accent.primaryMuted
                  : theme.colors.surface.base,
                borderWidth: 1,
                borderColor: filtersActive
                  ? theme.colors.accent.primary
                  : theme.colors.border.subtle,
              }}>
              <Text
                variant="caption"
                color={filtersActive ? 'accent' : 'secondary'}
                style={{fontWeight: '600'}}>
                {filtersActive
                  ? t('activity.filtersCount', {count: activeFilterCount})
                  : t('activity.filters')}
              </Text>
              {filtersActive ? (
                <View
                  style={{
                    minWidth: 20,
                    height: 20,
                    paddingHorizontal: theme.space[1],
                    borderRadius: theme.radius.full,
                    backgroundColor: theme.colors.accent.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text variant="label" color="inverse">
                    {activeFilterCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>

            {filtersActive ? (
              <Pressable
                onPress={onClearAllFilters}
                accessibilityLabel={t('activity.clearFilters')}
                minSize={false}
                style={{
                  minHeight: theme.touchTarget,
                  paddingHorizontal: theme.space[3],
                  borderRadius: theme.radius.full,
                  justifyContent: 'center',
                  backgroundColor: 'transparent',
                }}>
                <Text variant="caption" color="accent" style={{fontWeight: '600'}}>
                  {t('activity.clearFilters')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}
