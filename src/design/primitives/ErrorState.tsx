import {View} from 'react-native';

import {useTheme} from '../theme/ThemeProvider';

import {Button} from './Button';
import {Text} from './Text';

export type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  const {theme} = useTheme();

  return (
    <View
      accessibilityRole="alert"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.space[6],
        gap: theme.space[3],
      }}>
      <Text variant="headline" color="negative" align="center">
        {title}
      </Text>
      <Text variant="body" color="secondary" align="center">
        {message}
      </Text>
      {onRetry ? <Button label={retryLabel} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}
