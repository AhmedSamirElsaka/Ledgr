import {Component, type ErrorInfo, type ReactNode} from 'react';

import {StatusBar, View} from 'react-native';

import {ErrorState} from '../design/primitives/ErrorState';
import {useTheme} from '../design/theme/ThemeProvider';
import {i18n} from '../i18n';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
  resetKey: number;
};

function AppCrashFallback({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry: () => void;
}) {
  const {theme} = useTheme();
  const detail = error?.message?.trim();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.bg.app,
        justifyContent: 'center',
      }}>
      <StatusBar barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <ErrorState
        title={i18n.t('appError.title')}
        message={
          detail
            ? i18n.t('appError.messageWithDetail', {detail})
            : i18n.t('appError.message')
        }
        onRetry={onRetry}
        retryLabel={i18n.t('common.retry')}
      />
    </View>
  );
}

/**
 * Top-level recoverable boundary. No telemetry — failures stay on-device.
 */
export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  override state: AppErrorBoundaryState = {error: null, resetKey: 0};

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return {error};
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally no remote reporting (offline-only).
  }

  private handleRetry = () => {
    this.setState(prev => ({
      error: null,
      resetKey: prev.resetKey + 1,
    }));
  };

  override render() {
    if (this.state.error) {
      return (
        <AppCrashFallback error={this.state.error} onRetry={this.handleRetry} />
      );
    }
    return (
      <View key={this.state.resetKey} style={{flex: 1}}>
        {this.props.children}
      </View>
    );
  }
}
