import {migration001Initial} from './001_initial';
import {migration002BackupRestoreSafety} from './002_backup_restore_safety';
import {migration003ReceiptPath} from './003_receipt_path';
import {migration004SmsIdentity} from './004_sms_identity';

import type {Migration} from '../migrate';

export const migrations: readonly Migration[] = [
  migration001Initial,
  migration002BackupRestoreSafety,
  migration003ReceiptPath,
  migration004SmsIdentity,
];
