import {createContext, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';

import {closeDatabase, initDatabase} from './connection';
import {createRepos, type DatabaseRepos} from './createRepos';

type DatabaseContextValue = {
  status: 'loading' | 'ready' | 'error';
  error: Error | null;
  repos: DatabaseRepos | null;
  retry: () => void;
};

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({children}: {children: ReactNode}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [repos, setRepos] = useState<DatabaseRepos | null>(null);
  const [bootId, setBootId] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    (async () => {
      try {
        const db = await initDatabase();
        if (cancelled) {
          return;
        }
        setRepos(createRepos(db));
        setStatus('ready');
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      closeDatabase().catch(() => undefined);
    };
  }, [bootId]);

  const retry = () => setBootId(v => v + 1);

  const value = useMemo(
    () => ({status, error, repos, retry}),
    [status, error, repos],
  );

  return (
    <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return ctx;
}

export function useRepos(): DatabaseRepos {
  const {repos, status} = useDatabase();
  if (status !== 'ready' || !repos) {
    throw new Error('Database is not ready');
  }
  return repos;
}

export type {DatabaseRepos};
