import {useCallback, useMemo, useRef} from 'react';

import {View, type LayoutChangeEvent} from 'react-native';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import {isIconName, Icon} from '../../../design/icons/Icon';
import {IconButton} from '../../../design/primitives/IconButton';
import {ListRow} from '../../../design/primitives/ListRow';
import {useTheme} from '../../../design/theme/ThemeProvider';

import type {CategoryRow} from '../../../db/repositories/categoriesRepository';

type CategoryDraggableRowProps = {
  item: CategoryRow;
  kindLabel: string;
  nestedLabel: string;
  busy: boolean;
  dragEnabled: boolean;
  dragHint: string;
  moveUpLabel: string;
  moveDownLabel: string;
  archiveLabel: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  onDragStart: () => void;
  onDragEnd: (translationY: number) => void;
  onPress: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onArchive: () => void;
};

export function CategoryDraggableRow({
  item,
  kindLabel,
  nestedLabel,
  busy,
  dragEnabled,
  dragHint,
  moveUpLabel,
  moveDownLabel,
  archiveLabel,
  canMoveUp,
  canMoveDown,
  onLayout,
  onDragStart,
  onDragEnd,
  onPress,
  onMoveUp,
  onMoveDown,
  onArchive,
}: CategoryDraggableRowProps) {
  const {theme} = useTheme();
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(0);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  onDragStartRef.current = onDragStart;
  onDragEndRef.current = onDragEnd;

  const invokeDragStart = useCallback(() => {
    onDragStartRef.current();
  }, []);
  const invokeDragEnd = useCallback((translationY: number) => {
    onDragEndRef.current(translationY);
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(420)
        .enabled(dragEnabled && !busy)
        .onStart(() => {
          isDragging.value = 1;
          runOnJS(invokeDragStart)();
        })
        .onUpdate(event => {
          translateY.value = event.translationY;
        })
        .onEnd(event => {
          runOnJS(invokeDragEnd)(event.translationY);
          translateY.value = 0;
          isDragging.value = 0;
        })
        .onFinalize(() => {
          translateY.value = 0;
          isDragging.value = 0;
        }),
    [busy, dragEnabled, invokeDragEnd, invokeDragStart, isDragging, translateY],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    // Finger-follow only — no timed springs; ThemeProvider disables decorative motion.
    transform: [{translateY: translateY.value}],
    zIndex: isDragging.value ? 20 : 0,
    elevation: isDragging.value ? 4 : 0,
    opacity: isDragging.value ? 0.92 : 1,
  }));

  const subtitle = item.parent_id
    ? `${kindLabel} · ${nestedLabel}`
    : kindLabel;

  const leading = isIconName(item.icon) ? (
    <View
      style={{
        width: theme.touchTarget,
        height: theme.touchTarget,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.accent.primaryMuted,
      }}>
      <Icon name={item.icon} color={item.color} size={20} />
    </View>
  ) : (
    <View
      style={{
        width: theme.touchTarget,
        height: theme.touchTarget,
        borderRadius: theme.radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.accent.primaryMuted,
      }}>
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: theme.radius.full,
          backgroundColor: item.color,
        }}
      />
    </View>
  );

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        onLayout={onLayout}
        style={[
          animatedStyle,
          item.parent_id ? {marginStart: theme.space[6]} : null,
        ]}>
        <ListRow
          title={item.name}
          subtitle={subtitle}
          accessibilityHint={dragEnabled ? dragHint : undefined}
          showDisclosure={false}
          leading={leading}
          trailing={
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              {dragEnabled ? (
                <View
                  accessible={false}
                  importantForAccessibility="no-hide-descendants"
                  style={{
                    width: theme.touchTarget,
                    height: theme.touchTarget,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Icon
                    name="GripVertical"
                    size={18}
                    color={theme.colors.text.tertiary}
                  />
                </View>
              ) : null}
              <IconButton
                name="ChevronUp"
                accessibilityLabel={moveUpLabel}
                disabled={busy || !canMoveUp}
                onPress={onMoveUp}
              />
              <IconButton
                name="ChevronDown"
                accessibilityLabel={moveDownLabel}
                disabled={busy || !canMoveDown}
                onPress={onMoveDown}
              />
              <IconButton
                name="Trash2"
                tone="danger"
                accessibilityLabel={archiveLabel}
                disabled={busy}
                onPress={onArchive}
              />
            </View>
          }
          onPress={onPress}
        />
      </Animated.View>
    </GestureDetector>
  );
}
