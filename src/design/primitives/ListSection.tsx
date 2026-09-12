import {
  Children,
  Fragment,
  type ReactNode,
} from 'react';

import {View, type StyleProp, type ViewStyle} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

import {Card} from './Card';
import {Text} from './Text';

export type ListSectionProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Elevated group card for settings/menu lists with hairline separators.
 * Pair with `ListRow variant="inset"` (or plain Pressable rows).
 */
export function ListSection({
  children,
  title,
  description,
  style,
  testID,
}: ListSectionProps) {
  const {theme} = useTheme();
  const items = Children.toArray(children).filter(Boolean);

  return (
    <View style={[{gap: theme.space[2]}, style]} testID={testID}>
      {title || description ? (
        <View style={{gap: theme.space[1], paddingHorizontal: theme.space[1]}}>
          {title ? (
            <Text variant="label" color="tertiary">
              {title}
            </Text>
          ) : null}
          {description ? (
            <Text variant="caption" color="secondary">
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}
      <Card padded={false}>
        {items.map((child, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <View
                style={{
                  height: 1,
                  marginStart: theme.space[4],
                  backgroundColor: theme.colors.border.subtle,
                }}
              />
            ) : null}
            {child}
          </Fragment>
        ))}
      </Card>
    </View>
  );
}
