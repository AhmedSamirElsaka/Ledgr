/**
 * Jest setup — RNTL v12+ ships built-in Jest matchers; no extra import needed.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

jest.spyOn(console, 'warn').mockImplementation(() => undefined);

jest.mock('lucide-react-native', () => {
  const React = require('react');
  const {View} = require('react-native');
  const MockIcon = (props: {accessibilityLabel?: string}) =>
    React.createElement(View, {
      accessibilityLabel: props.accessibilityLabel,
      testID: 'mock-lucide-icon',
    });
  return new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === '__esModule') {
          return true;
        }
        return MockIcon;
      },
    },
  );
});

jest.mock('react-native-mmkv', () => {
  const store = new Map();
  return {
    createMMKV: () => ({
      getString: (key: string) => store.get(`s:${key}`),
      set: (key: string, value: string | number | boolean) => {
        if (typeof value === 'boolean') {
          store.set(`b:${key}`, value);
        } else if (typeof value === 'number') {
          store.set(`n:${key}`, value);
        } else {
          store.set(`s:${key}`, value);
        }
      },
      getBoolean: (key: string) => store.get(`b:${key}`),
      getNumber: (key: string) => store.get(`n:${key}`),
      remove: (key: string) => {
        store.delete(`s:${key}`);
        store.delete(`b:${key}`);
        store.delete(`n:${key}`);
      },
    }),
  };
});

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
  default: {trigger: jest.fn()},
}));

jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  return {
    BottomSheetModalProvider: ({children}: {children: unknown}) => children,
    BottomSheetModal: React.forwardRef(() => null),
    BottomSheetBackdrop: () => null,
  };
});

jest.mock('react-native-worklets', () => ({
  __esModule: true,
  createSerializable: (v: unknown) => v,
  createWorkletRuntime: () => ({}),
  runOnUI: (fn: (...args: unknown[]) => unknown) => fn,
  runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
  shareableMappingCache: new Map(),
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const {View} = require('react-native');

  const chain = () => {
    const api: Record<string, unknown> = {};
    api.duration = () => api;
    api.springify = () => api;
    api.damping = () => api;
    api.delay = () => api;
    api.build = () => undefined;
    return api;
  };

  const AnimatedView = React.forwardRef(
    (
      props: {children?: unknown; style?: unknown; entering?: unknown},
      ref: unknown,
    ) => React.createElement(View, {...props, ref}, props.children),
  );

  return {
    __esModule: true,
    default: {
      View: AnimatedView,
      Text: View,
      ScrollView: View,
      FlatList: View,
      createAnimatedComponent: (Comp: unknown) => Comp,
      call: () => undefined,
    },
    View: AnimatedView,
    Text: View,
    ScrollView: View,
    FlatList: View,
    useSharedValue: (value: number) => ({value}),
    useAnimatedStyle: (fn: () => unknown) => {
      try {
        return fn();
      } catch {
        return {};
      }
    },
    useReducedMotion: () => false,
    runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
    withSpring: (value: number) => value,
    withTiming: (value: number) => value,
    FadeIn: chain(),
    FadeInDown: chain(),
    FadeOut: chain(),
    Layout: chain(),
    Easing: {linear: (t: number) => t, ease: (t: number) => t},
  };
});

jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const {View} = require('react-native');
  const panChain = () => {
    const api: Record<string, unknown> = {};
    const self = () => api;
    api.activateAfterLongPress = self;
    api.enabled = self;
    api.onStart = self;
    api.onUpdate = self;
    api.onEnd = self;
    api.onFinalize = self;
    return api;
  };
  return {
    GestureHandlerRootView: View,
    GestureDetector: ({children}: {children?: unknown}) =>
      React.createElement(React.Fragment, null, children),
    Gesture: {
      Pan: () => panChain(),
    },
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    PanGestureHandler: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    TouchableOpacity: View,
    ScrollView: require('react-native').ScrollView,
    FlatList: require('react-native').FlatList,
  };
});

jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const React = require('react');
  const {View} = require('react-native');
  const Swipeable = React.forwardRef(
    (
      props: {
        children?: React.ReactNode;
        renderLeftActions?: () => React.ReactNode;
        renderRightActions?: () => React.ReactNode;
      },
      ref: React.Ref<{close: () => void; openLeft: () => void; openRight: () => void; reset: () => void}>,
    ) => {
      React.useImperativeHandle(ref, () => ({
        close: () => undefined,
        openLeft: () => undefined,
        openRight: () => undefined,
        reset: () => undefined,
      }));
      return React.createElement(
        View,
        null,
        props.renderLeftActions?.(),
        props.children,
        props.renderRightActions?.(),
      );
    },
  );
  Swipeable.displayName = 'Swipeable';
  return {__esModule: true, default: Swipeable};
});

jest.mock('react-native-screens', () => {
  const {View} = require('react-native');
  return {
    enableScreens: jest.fn(),
    Screen: View,
    ScreenContainer: View,
    NativeScreen: View,
    NativeScreenContainer: View,
  };
});

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn(async () => 'mock-channel'),
    requestPermission: jest.fn(async () => ({authorizationStatus: 1})),
    createTriggerNotification: jest.fn(async () => undefined),
    cancelNotification: jest.fn(async () => undefined),
  },
  AndroidImportance: {DEFAULT: 3},
  TriggerType: {TIMESTAMP: 0},
  RepeatFrequency: {DAILY: 1},
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => ({username: 'pin', password: '1234'})),
  getAllGenericPasswordServices: jest.fn(async () => []),
  getSupportedBiometryType: jest.fn(async () => 'FaceID'),
  resetGenericPassword: jest.fn(async () => true),
  ACCESSIBLE: {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY:
      'AccessibleWhenPasscodeSetThisDeviceOnly',
  },
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: 'BiometryCurrentSet',
  },
  SECURITY_LEVEL: {
    SECURE_SOFTWARE: 'SECURE_SOFTWARE',
    SECURE_HARDWARE: 'SECURE_HARDWARE',
  },
  BIOMETRY_TYPE: {
    FACE_ID: 'FaceID',
  },
  STORAGE_TYPE: {
    AES_GCM: 'KeystoreAESGCM',
  },
}));

jest.mock('react-native-fs', () => ({
  CachesDirectoryPath: '/tmp',
  DocumentDirectoryPath: '/tmp/documents',
  writeFile: jest.fn(async () => undefined),
  readFile: jest.fn(async () => ''),
  copyFile: jest.fn(async () => undefined),
  exists: jest.fn(async () => false),
  mkdir: jest.fn(async () => undefined),
  unlink: jest.fn(async () => undefined),
  readDir: jest.fn(async () => []),
}));

jest.mock('react-native-share', () => ({
  __esModule: true,
  default: {open: jest.fn(async () => undefined)},
}));

jest.mock('react-native-get-sms-android', () => ({
  list: jest.fn((_filter, _fail, success) => success(0, '[]')),
}));

jest.mock('react-native-restart', () => ({
  __esModule: true,
  default: {
    restart: jest.fn(),
    Restart: jest.fn(),
    getReason: jest.fn(async () => null),
  },
}));

jest.mock('react-native-gifted-charts', () => {
  const React = require('react');
  const {View} = require('react-native');
  const Mock = () => React.createElement(View, {testID: 'mock-chart'});
  return {LineChart: Mock, BarChart: Mock, PieChart: Mock};
});

jest.mock('react-native-linear-gradient', () => {
  const {View} = require('react-native');
  return View;
});

jest.mock('@shopify/flash-list', () => {
  const React = require('react');
  const {FlatList} = require('react-native');
  const FlashList = React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    React.createElement(FlatList, {...props, ref}),
  );
  FlashList.displayName = 'FlashList';
  return {__esModule: true, FlashList};
});

jest.mock('react-native-bootsplash', () => ({
  __esModule: true,
  hide: jest.fn(async () => undefined),
  isVisible: jest.fn(() => false),
  default: {
    hide: jest.fn(async () => undefined),
    isVisible: jest.fn(() => false),
  },
}));

jest.mock('@op-engineering/op-sqlite', () => {
  const tables = new Map();
  const settings = new Map();
  let userVersion = 0;

  const runSql = async (sql: string, params: unknown[] = []) => {
    const trimmed = sql.trim();
    if (trimmed === 'PRAGMA foreign_keys = ON') {
      return {rows: [], rowsAffected: 0};
    }
    if (trimmed === 'PRAGMA user_version') {
      return {rows: [{user_version: userVersion}], rowsAffected: 0};
    }
    const versionMatch = /^PRAGMA user_version\s*=\s*(\d+)$/i.exec(trimmed);
    if (versionMatch?.[1]) {
      userVersion = Number(versionMatch[1]);
      return {rows: [], rowsAffected: 0};
    }
    if (trimmed.startsWith('CREATE ') || trimmed.startsWith('CREATE INDEX')) {
      tables.set(trimmed.slice(0, 40), true);
      return {rows: [], rowsAffected: 0};
    }
    if (trimmed.startsWith('INSERT INTO settings')) {
      const key = String(params[0]);
      const value = String(params[1]);
      settings.set(key, value);
      return {rows: [], rowsAffected: 1};
    }
    if (trimmed.startsWith('INSERT INTO categories')) {
      return {rows: [], rowsAffected: 1};
    }
    if (trimmed.startsWith('SELECT value FROM settings')) {
      const key = String(params[0]);
      const value = settings.get(key);
      return {
        rows: value === undefined ? [] : [{value}],
        rowsAffected: 0,
      };
    }
    if (trimmed.startsWith('SELECT * FROM categories')) {
      return {rows: [], rowsAffected: 0};
    }
    if (trimmed.startsWith('EXPLAIN QUERY PLAN')) {
      return {
        rows: [{detail: 'SEARCH transactions USING INDEX idx_transactions_list'}],
        rowsAffected: 0,
      };
    }
    if (trimmed.startsWith('DELETE FROM transactions')) {
      return {rows: [], rowsAffected: 0};
    }
    return {rows: [], rowsAffected: 0};
  };

  const db = {
    execute: runSql,
    executeSync: (_sql: string, _params?: unknown[]) => {
      return {rows: [], rowsAffected: 0};
    },
    transaction: async (fn: (tx: {execute: typeof runSql}) => Promise<void>) => {
      await fn({execute: runSql});
    },
    close: () => undefined,
  };

  return {
    open: () => db,
  };
});
