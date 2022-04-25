import { useUser } from '../components/user-context.js';
import { hasUserPermission } from '../domain/permissions.js';
import { useCallback, useEffect, useMemo, useRef } from 'react';

export function usePermission(permissionToCheck) {
  const user = useUser();

  return useMemo(
    () => hasUserPermission(user, permissionToCheck),
    [permissionToCheck, user]
  );
}

export function useReloadPersistedWindow() {
  const handlePageShow = event => {
    if (event.persisted) {
      window.location.reload(true);
    }
  };

  useEffect(() => {
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);
}

export function useDebouncedCallback(callback, timeLimit = 250) {
  const storedCallback = useRef();
  const timeout = useRef();

  storedCallback.current = callback;

  useEffect(
    () => () => {
      timeout.current && clearTimeout(timeout.current);
      timeout.current = null;
    },
    [timeLimit, storedCallback]
  );

  return useCallback((...args) => {
    const oldCurrent = timeout.current;
    if (oldCurrent) {
      clearTimeout(oldCurrent);
    }

    timeout.current = setTimeout(() => {
      timeout.current = null;
      storedCallback.current(...args);
    }, timeLimit);
  }, [timeLimit, storedCallback]);
}
