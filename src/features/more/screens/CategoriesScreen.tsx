import {useCallback, useRef, useState} from 'react';

import {RefreshControl, View} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {ScrollView} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {EmptyIllustration} from '../../../design/motion/EmptyIllustration';
import {Button} from '../../../design/primitives/Button';
import {EmptyState} from '../../../design/primitives/EmptyState';
import {FeedbackBanner} from '../../../design/primitives/FeedbackBanner';
import {ScreenBackdrop} from '../../../design/primitives/ScreenBackdrop';
import {useTheme} from '../../../design/theme/ThemeProvider';
import {
  siblingIndexAfterDrag,
  type SiblingLayout,
} from '../../../domain/categories/siblingReorder';
import {hapticImpact} from '../../../lib/haptics';
import {CategoryDraggableRow} from '../components/CategoryDraggableRow';
import {
  MoreListStatusBody,
  MoreRefreshBanner,
} from '../components/MoreListStates';
import {useCategoriesScreen} from '../hooks/useCategoriesScreen';

import type {MoreStackParamList} from '../../../app/navigation/types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

export function CategoriesScreen() {
  const {t} = useTranslation();
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const {
    items,
    status,
    refreshing,
    refreshError,
    onRefresh,
    onRetry,
    dismissRefreshError,
    feedback,
    dismissFeedback,
    reorderingId,
    onArchive,
    onMove,
    onReorderToIndex,
    canMove,
    canDrag,
  } = useCategoriesScreen();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const layoutsRef = useRef(new Map<string, SiblingLayout>());

  const onRowLayout = useCallback((id: string, y: number, height: number) => {
    layoutsRef.current.set(id, {y, height});
  }, []);

  const beginDrag = useCallback((id: string) => {
    hapticImpact();
    setDraggingId(id);
  }, []);

  const onDragEnd = useCallback(
    (id: string, translationY: number) => {
      setDraggingId(null);
      const target = items.find(row => row.id === id);
      if (!target) {
        return;
      }
      const siblings = items
        .filter(row => row.parent_id === target.parent_id)
        .slice()
        .sort((a, b) => {
          if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
          }
          return a.id.localeCompare(b.id);
        });
      const fromIndex = siblings.findIndex(row => row.id === id);
      if (fromIndex < 0) {
        return;
      }
      const layouts: SiblingLayout[] = [];
      for (const row of siblings) {
        const layout = layoutsRef.current.get(row.id);
        if (!layout) {
          return;
        }
        layouts.push(layout);
      }
      const toIndex = siblingIndexAfterDrag(layouts, fromIndex, translationY);
      if (toIndex !== fromIndex) {
        onReorderToIndex(id, toIndex);
      }
    },
    [items, onReorderToIndex],
  );

  const showList = status === 'ready' || items.length > 0;

  return (
    <ScreenBackdrop washHeight={220}>
      <ScrollView
        style={{flex: 1}}
        scrollEnabled={draggingId == null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.accent.primary}
            colors={[theme.colors.accent.primary]}
          />
        }
        contentContainerStyle={{
          padding: theme.space[4],
          paddingBottom: insets.bottom + theme.space[8],
          gap: theme.space[3],
          flexGrow: 1,
        }}>
        <View style={{gap: theme.space[3], marginBottom: theme.space[3]}}>
          <MoreRefreshBanner
            visible={refreshError}
            onRetry={onRefresh}
            onDismiss={dismissRefreshError}
          />
          {feedback ? (
            <FeedbackBanner
              message={feedback.message}
              tone={feedback.tone}
              onDismiss={dismissFeedback}
              dismissAccessibilityLabel={t('common.close')}
            />
          ) : null}
          <Button
            label={t('categoriesScreen.add')}
            onPress={() => navigation.navigate('CategoryForm')}
            fullWidth
          />
        </View>

        {showList && items.length > 0 ? (
          items.map(item => {
            const kindLabel =
              item.kind === 'income'
                ? t('categoriesScreen.kindIncome')
                : t('categoriesScreen.kindExpense');
            const busy = reorderingId === item.id;
            const dragEnabled = canDrag(item.id);
            return (
              <CategoryDraggableRow
                key={item.id}
                item={item}
                kindLabel={kindLabel}
                nestedLabel={t('categoriesScreen.nested')}
                busy={busy}
                dragEnabled={dragEnabled}
                dragHint={t('categoriesScreen.dragReorderHint')}
                moveUpLabel={t('categoriesScreen.moveUpA11y', {
                  name: item.name,
                })}
                moveDownLabel={t('categoriesScreen.moveDownA11y', {
                  name: item.name,
                })}
                archiveLabel={t('categoriesScreen.archiveA11y', {
                  name: item.name,
                })}
                canMoveUp={canMove(item.id, 'up')}
                canMoveDown={canMove(item.id, 'down')}
                onLayout={event => {
                  const {y, height} = event.nativeEvent.layout;
                  onRowLayout(item.id, y, height);
                }}
                onDragStart={() => beginDrag(item.id)}
                onDragEnd={translationY => onDragEnd(item.id, translationY)}
                onPress={() =>
                  navigation.navigate('CategoryForm', {id: item.id})
                }
                onMoveUp={() => onMove(item.id, 'up')}
                onMoveDown={() => onMove(item.id, 'down')}
                onArchive={() => onArchive(item.id, item.name)}
              />
            );
          })
        ) : (
          <MoreListStatusBody
            status={status}
            itemCount={items.length}
            onRetry={onRetry}
            empty={
              <EmptyState
                title={t('categoriesScreen.emptyTitle')}
                description={t('categoriesScreen.emptyBody')}
                actionLabel={t('categoriesScreen.add')}
                onAction={() => navigation.navigate('CategoryForm')}
                illustration={
                  <EmptyIllustration name="Tag" secondaryName="Plus" />
                }
              />
            }
          />
        )}
      </ScrollView>
    </ScreenBackdrop>
  );
}
