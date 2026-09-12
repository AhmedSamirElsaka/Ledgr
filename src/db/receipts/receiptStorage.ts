import {
  DocumentDirectoryPath,
  copyFile,
  exists,
  mkdir,
  readDir,
  readFile,
  unlink,
  writeFile,
} from 'react-native-fs';

/** Relative directory under the app documents root. */
export const RECEIPTS_DIR_NAME = 'receipts';

export function receiptsDirectoryPath(): string {
  return `${DocumentDirectoryPath}/${RECEIPTS_DIR_NAME}`;
}

export function absoluteReceiptPath(relativePath: string): string {
  const trimmed = relativePath.replace(/^\/+/, '');
  return `${DocumentDirectoryPath}/${trimmed}`;
}

export function isManagedReceiptPath(relativePath: string | null | undefined): boolean {
  if (relativePath == null || relativePath.length === 0) {
    return false;
  }
  const normalized = relativePath.replace(/\\/g, '/');
  return (
    normalized.startsWith(`${RECEIPTS_DIR_NAME}/`) &&
    !normalized.includes('..') &&
    !normalized.startsWith('/')
  );
}

function extensionFromUri(uri: string, mimeType: string | null | undefined): string {
  const lowerMime = (mimeType ?? '').toLowerCase();
  if (lowerMime.includes('png')) {
    return 'png';
  }
  if (lowerMime.includes('webp')) {
    return 'webp';
  }
  if (lowerMime.includes('heic') || lowerMime.includes('heif')) {
    return 'heic';
  }
  const match = /\.([a-z0-9]+)(?:\?|#|$)/i.exec(uri);
  const ext = match?.[1]?.toLowerCase();
  if (ext === 'png' || ext === 'webp' || ext === 'heic' || ext === 'heif' || ext === 'jpeg') {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  return 'jpg';
}

export function buildRelativeReceiptPath(
  transactionId: string,
  sourceUri: string,
  mimeType?: string | null,
): string {
  const ext = extensionFromUri(sourceUri, mimeType);
  return `${RECEIPTS_DIR_NAME}/${transactionId}.${ext}`;
}

export async function ensureReceiptsDir(): Promise<string> {
  const dir = receiptsDirectoryPath();
  if (!(await exists(dir))) {
    await mkdir(dir);
  }
  return dir;
}

function stripFileScheme(uri: string): string {
  if (uri.startsWith('file://')) {
    return decodeURIComponent(uri.slice('file://'.length));
  }
  return uri;
}

/**
 * Copies a picked image into app-private storage.
 * Returns the portable relative path stored in SQLite.
 */
export async function importReceiptFile(input: {
  sourceUri: string;
  transactionId: string;
  mimeType?: string | null;
  previousRelativePath?: string | null;
}): Promise<string> {
  await ensureReceiptsDir();
  const relativePath = buildRelativeReceiptPath(
    input.transactionId,
    input.sourceUri,
    input.mimeType,
  );
  const dest = absoluteReceiptPath(relativePath);
  const source = stripFileScheme(input.sourceUri);

  if (input.previousRelativePath && input.previousRelativePath !== relativePath) {
    await deleteReceiptFile(input.previousRelativePath);
  }

  if (await exists(dest)) {
    await unlink(dest);
  }

  await copyFile(source, dest);
  return relativePath;
}

export async function deleteReceiptFile(relativePath: string | null | undefined): Promise<void> {
  if (!isManagedReceiptPath(relativePath) || relativePath == null) {
    return;
  }
  const abs = absoluteReceiptPath(relativePath);
  if (await exists(abs)) {
    await unlink(abs);
  }
}

export async function deleteReceiptFiles(
  relativePaths: ReadonlyArray<string | null | undefined>,
): Promise<void> {
  const unique = [...new Set(relativePaths.filter((p): p is string => typeof p === 'string'))];
  for (const path of unique) {
    await deleteReceiptFile(path);
  }
}

export async function readReceiptBase64(
  relativePath: string,
): Promise<string | null> {
  if (!isManagedReceiptPath(relativePath)) {
    return null;
  }
  const abs = absoluteReceiptPath(relativePath);
  if (!(await exists(abs))) {
    return null;
  }
  return readFile(abs, 'base64');
}

export async function writeReceiptBase64(relativePath: string, base64: string): Promise<void> {
  if (!isManagedReceiptPath(relativePath)) {
    throw new Error(`Refusing to write receipt outside ${RECEIPTS_DIR_NAME}/`);
  }
  await ensureReceiptsDir();
  const abs = absoluteReceiptPath(relativePath);
  await writeFile(abs, base64, 'base64');
}

export async function collectReceiptFiles(
  relativePaths: ReadonlyArray<string | null | undefined>,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  const unique = [...new Set(relativePaths.filter((p): p is string => typeof p === 'string'))];
  for (const relativePath of unique) {
    if (!isManagedReceiptPath(relativePath)) {
      continue;
    }
    const data = await readReceiptBase64(relativePath);
    if (data != null) {
      out[relativePath] = data;
    }
  }
  return out;
}

export async function restoreReceiptFiles(files: Readonly<Record<string, string>>): Promise<void> {
  for (const [relativePath, base64] of Object.entries(files)) {
    if (!isManagedReceiptPath(relativePath) || base64.length === 0) {
      continue;
    }
    await writeReceiptBase64(relativePath, base64);
  }
}

/**
 * Removes receipt files under receipts/ that are not referenced by any path set.
 */
export async function removeOrphanReceiptFiles(
  referencedRelativePaths: ReadonlySet<string>,
): Promise<number> {
  const dir = receiptsDirectoryPath();
  if (!(await exists(dir))) {
    return 0;
  }
  const entries = await readDir(dir);
  let removed = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) {
      continue;
    }
    const relativePath = `${RECEIPTS_DIR_NAME}/${entry.name}`;
    if (referencedRelativePaths.has(relativePath)) {
      continue;
    }
    await unlink(entry.path);
    removed += 1;
  }
  return removed;
}
