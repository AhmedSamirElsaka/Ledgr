import {NativeModules} from 'react-native';

export type PickedReceiptImage = {
  uri: string;
  mimeType: string | null;
};

type ReceiptPickerNative = {
  pickImage: () => Promise<unknown>;
};

function getReceiptPickerNative(): ReceiptPickerNative | undefined {
  const value: unknown = NativeModules.LedgrReceiptPicker;
  if (value == null || typeof value !== 'object') {
    return undefined;
  }
  if (!('pickImage' in value)) {
    return undefined;
  }
  const pickImage = value.pickImage;
  if (typeof pickImage !== 'function') {
    return undefined;
  }
  return {pickImage: () => Promise.resolve(pickImage.call(value))};
}

function parsePickedResult(value: unknown): PickedReceiptImage | null {
  if (value == null) {
    return null;
  }
  if (typeof value !== 'object') {
    throw new Error('Receipt picker returned an invalid result');
  }
  if (!('uri' in value) || typeof value.uri !== 'string' || value.uri.length === 0) {
    throw new Error('Receipt picker returned an invalid result');
  }
  const mimeType =
    'mimeType' in value && typeof value.mimeType === 'string' ? value.mimeType : null;
  return {uri: value.uri, mimeType};
}

const Native = getReceiptPickerNative();

/**
 * Opens the system image picker and returns a local file URI, or null if cancelled.
 */
export async function pickReceiptImage(): Promise<PickedReceiptImage | null> {
  if (!Native) {
    throw new Error('Receipt picker is unavailable on this build');
  }
  return parsePickedResult(await Native.pickImage());
}

export function isReceiptPickerAvailable(): boolean {
  return Native != null;
}
