import type {ReactNode} from 'react';

import {View, type StyleProp, type ViewStyle} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

import {Text} from './Text';

export type SectionHeaderSize = 'screen' | 'section';

export type SectionHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  trailing?: ReactNode;
  size?: SectionHeaderSize;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Editorial title block — label eyebrow, strong title, optional description.
 * `screen` for page heroes; `section` for in-page groups.
 */
export function SectionHeader({
  title,
  eyebrow,
  description,
  trailing,
  size = 'section',
  style,
  testID,
}: SectionHeaderProps) {
  const {theme} = useTheme();
  const titleVariant = size === 'screen' ? 'title' : 'headline';
  const alignEnd = Boolean(trailing);

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: 'row',
          alignItems: alignEnd ? 'flex-end' : 'flex-start',
          justifyContent: 'space-between',
          gap: theme.space[4],
        },
        style,
      ]}>
      <View style={{flex: 1, gap: theme.space[1], minWidth: 0}}>
        {eyebrow ? (
          <Text variant="label" color="tertiary">
            {eyebrow}
          </Text>
        ) : null}
        <Text variant={titleVariant}>{title}</Text>
        {description ? (
          <Text variant="body" color="secondary">
            {description}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <View
          style={{
            minHeight: theme.touchTarget,
            minWidth: theme.touchTarget,
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}>
          {trailing}
        </View>
      ) : null}
    </View>
  );
}
