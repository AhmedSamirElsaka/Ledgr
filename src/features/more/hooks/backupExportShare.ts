import {shareLocalFile} from '../../../lib/shareLocalFile';

export async function shareBackupFile(
  path: string,
  type: string,
  filename: string,
) {
  await shareLocalFile(path, type, filename);
}
