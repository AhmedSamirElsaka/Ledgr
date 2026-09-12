module.exports = {
  dependencies: {
    'react-native-get-sms-android': {
      platforms: {
        android: {
          packageImportPath: 'import com.react.SmsPackage;',
          packageInstance: 'new SmsPackage()',
        },
      },
    },
  },
};
