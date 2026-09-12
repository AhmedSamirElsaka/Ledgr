import {useState} from 'react';

import {useRepos} from '../../../db/DatabaseProvider';
import {useUiStore} from '../../../store/uiStore';

import {useBackupExportExports} from './useBackupExportExports';
import {useBackupExportImports} from './useBackupExportImports';

export function useBackupExport() {
  const repos = useRepos();
  const period = useUiStore(s => s.period);
  const customFrom = useUiStore(s => s.customFrom);
  const customTo = useUiStore(s => s.customTo);
  const [csvImportText, setCsvImportText] = useState('');
  const [jsonImportText, setJsonImportText] = useState('');
  const [busy, setBusy] = useState(false);

  const exports = useBackupExportExports({repos, period, customFrom, customTo, setBusy});
  const imports = useBackupExportImports({
    repos,
    csvImportText,
    jsonImportText,
    setCsvImportText,
    setJsonImportText,
    setBusy,
  });

  return {
    busy,
    csvImportText,
    jsonImportText,
    setCsvImportText: imports.onCsvImportTextChange,
    setJsonImportText: imports.onJsonImportTextChange,
    ...exports,
    ...imports,
  };
}
