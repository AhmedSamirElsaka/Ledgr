module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
        },
      },
    ],
    '@babel/plugin-transform-export-namespace-from',
    // reanimated/plugin re-exports worklets/plugin — listing both duplicates Babel.
    'react-native-reanimated/plugin',
  ],
};
