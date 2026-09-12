import * as Keychain from 'react-native-keychain';

import {
  clearPin,
  getAppLockConfig,
  setAppLockEnabled,
  setBiometricEnabled,
  setPin,
  verifyPin,
} from '../appLock';

type StoredCredential = {
  username: string;
  password: string;
};

const credentials = new Map<string, StoredCredential>();

const setGenericPassword = jest.mocked(Keychain.setGenericPassword);
const getGenericPassword = jest.mocked(Keychain.getGenericPassword);
const getAllGenericPasswordServices = jest.mocked(
  Keychain.getAllGenericPasswordServices,
);
const getSupportedBiometryType = jest.mocked(
  Keychain.getSupportedBiometryType,
);
const resetGenericPassword = jest.mocked(Keychain.resetGenericPassword);

beforeEach(async () => {
  credentials.clear();
  setGenericPassword.mockImplementation(
    async (username, password, options) => {
      const service = options?.service ?? 'default';
      credentials.set(service, {username, password});
      return {service, storage: Keychain.STORAGE_TYPE.AES_GCM};
    },
  );
  getGenericPassword.mockImplementation(async options => {
    const service = options?.service ?? 'default';
    const stored = credentials.get(service);
    if (!stored) {
      return false;
    }
    return {
      ...stored,
      service,
      storage: Keychain.STORAGE_TYPE.AES_GCM,
    };
  });
  getAllGenericPasswordServices.mockImplementation(async () =>
    Array.from(credentials.keys()),
  );
  getSupportedBiometryType.mockResolvedValue(Keychain.BIOMETRY_TYPE.FACE_ID);
  resetGenericPassword.mockImplementation(async options => {
    credentials.delete(options?.service ?? 'default');
    return true;
  });

  await clearPin();
  jest.clearAllMocks();
});

it('refuses to enable app lock without a successfully stored PIN', async () => {
  await expect(setPin('123')).resolves.toBe(false);
  await expect(setAppLockEnabled(true)).resolves.toBe(false);

  expect(setGenericPassword).not.toHaveBeenCalled();
  expect(getAppLockConfig()).toMatchObject({
    enabled: false,
    hasPin: false,
  });
});

it('keeps app lock disabled when Keychain rejects a valid PIN write', async () => {
  setGenericPassword.mockResolvedValueOnce(false);

  await expect(setPin('1234')).resolves.toBe(false);
  await expect(setAppLockEnabled(true)).resolves.toBe(false);
  expect(getAppLockConfig()).toMatchObject({
    enabled: false,
    hasPin: false,
  });
});

it('stores a salted derived verifier instead of a comparable PIN', async () => {
  await expect(setPin('1234')).resolves.toBe(true);

  const stored = credentials.get('ledgr-app-lock');
  expect(stored?.username).toBe('pin-verifier-v1');
  expect(stored?.password).not.toContain('1234');
  expect(stored?.password).toMatch(
    /^v1\$pbkdf2-sha256\$50000\$[0-9a-f]{32}\$[0-9a-f]{64}$/,
  );
  expect(setGenericPassword).toHaveBeenCalledWith(
    'pin-verifier-v1',
    expect.any(String),
    expect.objectContaining({
      service: 'ledgr-app-lock',
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
    }),
  );
  await expect(setAppLockEnabled(true)).resolves.toBe(true);
  expect(getAppLockConfig().enabled).toBe(true);
});

it('migrates a matching legacy plaintext Keychain PIN after unlock', async () => {
  credentials.set('ledgr-app-lock', {
    username: 'pin',
    password: '١٢٣٤',
  });

  await expect(setAppLockEnabled(true)).resolves.toBe(true);
  await expect(verifyPin('1234')).resolves.toBe(true);

  const migrated = credentials.get('ledgr-app-lock');
  expect(migrated?.username).toBe('pin-verifier-v1');
  expect(migrated?.password).not.toContain('1234');
});

it('backs off failed attempts without permanently locking the user out', async () => {
  await setPin('9876');

  const startedAt = Date.now();
  await expect(verifyPin('0000')).resolves.toBe(false);
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(200);
  await expect(verifyPin('9876')).resolves.toBe(true);
}, 15_000);

it('keeps lock disabled after clearing a previously enrolled PIN', async () => {
  await setPin('1357');
  await setAppLockEnabled(true);
  expect(getAppLockConfig().enabled).toBe(true);

  await clearPin();

  expect(getAppLockConfig()).toMatchObject({
    enabled: false,
    hasPin: false,
    biometricEnabled: false,
  });
  await expect(setAppLockEnabled(true)).resolves.toBe(false);
});

it('protects biometric access on write and clearing PIN disables both', async () => {
  await setPin('2468');
  await setAppLockEnabled(true);
  await expect(
    setBiometricEnabled(true, {
      title: 'Unlock',
      subtitle: 'Confirm',
      cancel: 'Cancel',
    }),
  ).resolves.toBe(true);

  expect(setGenericPassword).toHaveBeenLastCalledWith(
    'biometric-v1',
    'enabled',
    expect.objectContaining({
      service: 'ledgr-app-lock-biometric-v1',
      accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
    }),
  );
  expect(getAppLockConfig().biometricEnabled).toBe(true);

  await clearPin();

  expect(getAppLockConfig()).toMatchObject({
    enabled: false,
    hasPin: false,
    biometricEnabled: false,
  });
  expect(credentials.size).toBe(0);
});
