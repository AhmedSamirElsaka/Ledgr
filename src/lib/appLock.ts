import * as Keychain from 'react-native-keychain';

import {
  getPrefBoolean,
  getPrefNumber,
  getPrefString,
  removePref,
  setPrefBoolean,
  setPrefNumber,
  setPrefString,
} from './prefs';

const PIN_SERVICE = 'ledgr-app-lock';
const BIOMETRIC_SERVICE = 'ledgr-app-lock-biometric-v1';
const LEGACY_PIN_USERNAME = 'pin';
const PIN_USERNAME = 'pin-verifier-v1';
const VERIFIER_VERSION = 'v1';
const VERIFIER_ALGORITHM = 'pbkdf2-sha256';
const PBKDF2_ITERATIONS = 50_000;
const SALT_BYTES = 16;
const SHA256_BYTES = 32;
const HMAC_BLOCK_BYTES = 64;
const FIRST_BACKOFF_MS = 250;
const MAX_BACKOFF_MS = 4_000;

let fallbackSaltCounter = 0;

export type BiometricPrompt = {
  title: string;
  subtitle: string;
  cancel: string;
};

export type AppLockConfig = {
  enabled: boolean;
  hasPin: boolean;
  biometricEnabled: boolean;
  autoLockSeconds: number;
};

export function getAppLockConfig(): AppLockConfig {
  const hasPin = getPrefBoolean('appLock.hasPin') === true;
  return {
    enabled: hasPin && getPrefBoolean('appLock.enabled') === true,
    hasPin,
    biometricEnabled:
      hasPin && getPrefBoolean('appLock.biometric') === true,
    autoLockSeconds: getPrefNumber('appLock.autoLockSeconds') ?? 60,
  };
}

export async function setAppLockEnabled(enabled: boolean): Promise<boolean> {
  if (!enabled) {
    setPrefBoolean('appLock.enabled', false);
    return true;
  }

  const hasPin = await hasStoredPin();
  setPrefBoolean('appLock.hasPin', hasPin);
  if (!hasPin) {
    setPrefBoolean('appLock.enabled', false);
    return false;
  }

  setPrefBoolean('appLock.enabled', enabled);
  return true;
}

export async function setBiometricEnabled(
  enabled: boolean,
  prompt?: BiometricPrompt,
): Promise<boolean> {
  if (!enabled) {
    await resetKeychainService(BIOMETRIC_SERVICE);
    setPrefBoolean('appLock.biometric', false);
    return true;
  }

  if (!(await hasStoredPin())) {
    setPrefBoolean('appLock.biometric', false);
    return false;
  }

  const configured = await createBiometricCredential(prompt);
  setPrefBoolean('appLock.biometric', configured);
  return configured;
}

export function setAutoLockSeconds(seconds: number): void {
  const safeSeconds = Number.isFinite(seconds)
    ? Math.max(0, Math.floor(seconds))
    : 60;
  setPrefNumber('appLock.autoLockSeconds', safeSeconds);
}

export async function setPin(pin: string): Promise<boolean> {
  const normalizedPin = normalizePin(pin);
  if (!isValidPin(normalizedPin)) {
    return false;
  }

  try {
    // Let pending UI state (for example, a saving indicator) render first.
    await wait(0);
    const verifier = deriveVerifier(normalizedPin, createSalt());
    const result = await Keychain.setGenericPassword(PIN_USERNAME, verifier, {
      service: PIN_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
    });
    if (!result) {
      return false;
    }
    setPrefBoolean('appLock.hasPin', true);
    resetFailedAttempts();
    return true;
  } catch {
    return false;
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  const normalizedPin = normalizePin(pin);

  try {
    const creds = await Keychain.getGenericPassword({service: PIN_SERVICE});
    if (!creds) {
      return failPinAttempt();
    }

    let matches = false;
    if (creds.username === PIN_USERNAME) {
      matches = verifyDerivedPin(normalizedPin, creds.password);
    } else if (creds.username === LEGACY_PIN_USERNAME) {
      const normalizedLegacyPin = normalizePin(creds.password);
      matches =
        isValidPin(normalizedPin) &&
        constantTimeEqual(
          utf8Bytes(normalizedPin),
          utf8Bytes(normalizedLegacyPin),
        );
    }

    if (!matches) {
      return failPinAttempt();
    }

    resetFailedAttempts();
    if (creds.username === LEGACY_PIN_USERNAME) {
      // A failed migration must not prevent an existing user from unlocking.
      await setPin(normalizedPin);
    }
    return true;
  } catch {
    return failPinAttempt();
  }
}

export async function clearPin(): Promise<void> {
  await Promise.all([
    resetKeychainService(PIN_SERVICE),
    resetKeychainService(BIOMETRIC_SERVICE),
  ]);
  setPrefBoolean('appLock.hasPin', false);
  setPrefBoolean('appLock.enabled', false);
  setPrefBoolean('appLock.biometric', false);
  resetFailedAttempts();
}

export async function promptBiometric(
  prompt: BiometricPrompt,
): Promise<boolean> {
  if (!getAppLockConfig().biometricEnabled) {
    return false;
  }

  try {
    const services = await Keychain.getAllGenericPasswordServices({
      skipUIAuth: true,
    });
    if (!services.includes(BIOMETRIC_SERVICE)) {
      const migrated = await createBiometricCredential(prompt);
      if (!migrated) {
        setPrefBoolean('appLock.biometric', false);
        return false;
      }
    }

    const result = await Keychain.getGenericPassword({
      service: BIOMETRIC_SERVICE,
      authenticationPrompt: prompt,
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
    });
    return (
      result !== false &&
      result.username === 'biometric-v1' &&
      result.password === 'enabled'
    );
  } catch {
    return false;
  }
}

export function markUnlocked(): void {
  setPrefString('appLock.lastUnlockAt', String(Date.now()));
}

export function shouldLockNow(): boolean {
  const config = getAppLockConfig();
  if (!config.enabled) {
    return false;
  }
  const last = Number(getPrefString('appLock.lastUnlockAt') ?? '0');
  if (!last) {
    return true;
  }
  return Date.now() - last >= config.autoLockSeconds * 1000;
}

export function isValidPin(pin: string): boolean {
  return /^[0-9]{4,}$/.test(normalizePin(pin));
}

function normalizePin(pin: string): string {
  return pin
    .replace(/[\u0660-\u0669]/g, digit =>
      String(digit.charCodeAt(0) - 0x0660),
    )
    .replace(/[\u06f0-\u06f9]/g, digit =>
      String(digit.charCodeAt(0) - 0x06f0),
    );
}

async function hasStoredPin(): Promise<boolean> {
  try {
    const creds = await Keychain.getGenericPassword({service: PIN_SERVICE});
    if (!creds) {
      return false;
    }
    return (
      (creds.username === PIN_USERNAME &&
        parseVerifier(creds.password) !== undefined) ||
      (creds.username === LEGACY_PIN_USERNAME &&
        isValidPin(creds.password))
    );
  } catch {
    return false;
  }
}

async function createBiometricCredential(
  prompt?: BiometricPrompt,
): Promise<boolean> {
  try {
    const biometry = await Keychain.getSupportedBiometryType();
    if (biometry === null) {
      return false;
    }
    const result = await Keychain.setGenericPassword(
      'biometric-v1',
      'enabled',
      {
        service: BIOMETRIC_SERVICE,
        accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
        authenticationPrompt: prompt,
      },
    );
    return result !== false;
  } catch {
    return false;
  }
}

async function resetKeychainService(service: string): Promise<void> {
  try {
    await Keychain.resetGenericPassword({service});
  } catch {
    // Preferences are still disabled so inaccessible credentials cannot unlock.
  }
}

async function failPinAttempt(): Promise<false> {
  const attempts = (getPrefNumber('appLock.failedAttempts') ?? 0) + 1;
  setPrefNumber('appLock.failedAttempts', attempts);
  const delay = Math.min(
    FIRST_BACKOFF_MS * 2 ** Math.min(attempts - 1, 8),
    MAX_BACKOFF_MS,
  );
  await wait(delay);
  return false;
}

function resetFailedAttempts(): void {
  removePref('appLock.failedAttempts');
}

function wait(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

type ParsedVerifier = {
  iterations: number;
  salt: Uint8Array;
  hash: Uint8Array;
};

function deriveVerifier(pin: string, salt: Uint8Array): string {
  const hash = pbkdf2Sha256(utf8Bytes(pin), salt, PBKDF2_ITERATIONS);
  return [
    VERIFIER_VERSION,
    VERIFIER_ALGORITHM,
    String(PBKDF2_ITERATIONS),
    bytesToHex(salt),
    bytesToHex(hash),
  ].join('$');
}

function verifyDerivedPin(pin: string, encoded: string): boolean {
  if (!isValidPin(pin)) {
    return false;
  }
  const parsed = parseVerifier(encoded);
  if (!parsed) {
    return false;
  }
  const actual = pbkdf2Sha256(
    utf8Bytes(pin),
    parsed.salt,
    parsed.iterations,
  );
  return constantTimeEqual(actual, parsed.hash);
}

function parseVerifier(encoded: string): ParsedVerifier | undefined {
  const parts = encoded.split('$');
  if (
    parts.length !== 5 ||
    parts[0] !== VERIFIER_VERSION ||
    parts[1] !== VERIFIER_ALGORITHM
  ) {
    return undefined;
  }
  const iterations = Number(parts[2]);
  const saltHex = parts[3];
  const hashHex = parts[4];
  if (
    iterations !== PBKDF2_ITERATIONS ||
    saltHex === undefined ||
    hashHex === undefined
  ) {
    return undefined;
  }
  const salt = hexToBytes(saltHex);
  const hash = hexToBytes(hashHex);
  if (!salt || salt.length < SALT_BYTES || !hash || hash.length !== SHA256_BYTES) {
    return undefined;
  }
  return {iterations, salt, hash};
}

function createSalt(): Uint8Array {
  const bytes = new Uint8Array(SALT_BYTES);
  const cryptoValue: unknown = Reflect.get(globalThis, 'crypto');
  if (hasGetRandomValues(cryptoValue)) {
    try {
      return cryptoValue.getRandomValues(bytes);
    } catch {
      // Older RN engines expose crypto without a working random implementation.
    }
  }

  fallbackSaltCounter += 1;
  const entropy = [
    Date.now(),
    fallbackSaltCounter,
    Math.random(),
    Math.random(),
  ].join(':');
  return sha256(utf8Bytes(entropy)).slice(0, SALT_BYTES);
}

function hasGetRandomValues(
  value: unknown,
): value is {getRandomValues: (bytes: Uint8Array) => Uint8Array} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getRandomValues' in value &&
    typeof value.getRandomValues === 'function'
  );
}

function pbkdf2Sha256(
  password: Uint8Array,
  salt: Uint8Array,
  iterations: number,
): Uint8Array {
  /* eslint-disable no-bitwise -- SHA-256 operates on 32-bit words. */
  const blockInput = new Uint8Array(salt.length + 4);
  blockInput.set(salt);
  blockInput[blockInput.length - 1] = 1;

  let previous = hmacSha256(password, blockInput);
  const result = previous.slice();
  for (let iteration = 1; iteration < iterations; iteration += 1) {
    previous = hmacSha256(password, previous);
    for (let index = 0; index < result.length; index += 1) {
      result[index] = (result[index] ?? 0) ^ (previous[index] ?? 0);
    }
  }
  return result;
}

function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  const normalizedKey =
    key.length > HMAC_BLOCK_BYTES ? sha256(key) : key;
  const innerPad = new Uint8Array(HMAC_BLOCK_BYTES);
  const outerPad = new Uint8Array(HMAC_BLOCK_BYTES);
  for (let index = 0; index < HMAC_BLOCK_BYTES; index += 1) {
    const keyByte = normalizedKey[index] ?? 0;
    innerPad[index] = keyByte ^ 0x36;
    outerPad[index] = keyByte ^ 0x5c;
  }
  return sha256(concatBytes(outerPad, sha256(concatBytes(innerPad, message))));
}

function sha256(input: Uint8Array): Uint8Array {
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b,
    0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7,
    0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152,
    0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
    0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819,
    0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f,
    0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ] as const;
  const initial = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f,
    0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];
  const bitLength = input.length * 8;
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(input);
  padded[input.length] = 0x80;
  const dataView = new DataView(padded.buffer);
  dataView.setUint32(paddedLength - 8, Math.floor(bitLength / 0x1_0000_0000));
  dataView.setUint32(paddedLength - 4, bitLength >>> 0);

  for (let offset = 0; offset < padded.length; offset += 64) {
    const words = new Uint32Array(64);
    for (let index = 0; index < 16; index += 1) {
      words[index] = dataView.getUint32(offset + index * 4);
    }
    for (let index = 16; index < 64; index += 1) {
      const word15 = words[index - 15] ?? 0;
      const word2 = words[index - 2] ?? 0;
      const sigma0 =
        rotateRight(word15, 7) ^ rotateRight(word15, 18) ^ (word15 >>> 3);
      const sigma1 =
        rotateRight(word2, 17) ^ rotateRight(word2, 19) ^ (word2 >>> 10);
      words[index] =
        ((words[index - 16] ?? 0) +
          sigma0 +
          (words[index - 7] ?? 0) +
          sigma1) >>>
        0;
    }

    let a = initial[0] ?? 0;
    let b = initial[1] ?? 0;
    let c = initial[2] ?? 0;
    let d = initial[3] ?? 0;
    let e = initial[4] ?? 0;
    let f = initial[5] ?? 0;
    let g = initial[6] ?? 0;
    let h = initial[7] ?? 0;

    for (let index = 0; index < 64; index += 1) {
      const sum1 =
        rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 =
        (h +
          sum1 +
          choice +
          (constants[index] ?? 0) +
          (words[index] ?? 0)) >>>
        0;
      const sum0 =
        rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sum0 + majority) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    initial[0] = ((initial[0] ?? 0) + a) >>> 0;
    initial[1] = ((initial[1] ?? 0) + b) >>> 0;
    initial[2] = ((initial[2] ?? 0) + c) >>> 0;
    initial[3] = ((initial[3] ?? 0) + d) >>> 0;
    initial[4] = ((initial[4] ?? 0) + e) >>> 0;
    initial[5] = ((initial[5] ?? 0) + f) >>> 0;
    initial[6] = ((initial[6] ?? 0) + g) >>> 0;
    initial[7] = ((initial[7] ?? 0) + h) >>> 0;
  }

  const output = new Uint8Array(SHA256_BYTES);
  const outputView = new DataView(output.buffer);
  initial.forEach((word, index) => {
    outputView.setUint32(index * 4, word);
  });
  return output;
}

function rotateRight(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function utf8Bytes(value: string): Uint8Array {
  const bytes: number[] = [];
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined) {
      continue;
    }
    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }
  return Uint8Array.from(bytes);
}

function concatBytes(first: Uint8Array, second: Uint8Array): Uint8Array {
  const result = new Uint8Array(first.length + second.length);
  result.set(first);
  result.set(second, first.length);
  return result;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array | undefined {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    return undefined;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(first: Uint8Array, second: Uint8Array): boolean {
  let difference = first.length ^ second.length;
  const length = Math.max(first.length, second.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (first[index] ?? 0) ^ (second[index] ?? 0);
  }
  return difference === 0;
}
/* eslint-enable no-bitwise */
