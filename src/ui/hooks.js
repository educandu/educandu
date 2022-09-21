import deepEqual from 'fast-deep-equal';
import { useUser } from '../components/user-context.js';
import { hasUserPermission } from '../domain/permissions.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  const lastPendingArgs = useRef();
  const storedCallback = useRef();
  const timeout = useRef();

  storedCallback.current = callback;

  useEffect(
    () => () => {
      timeout.current && clearTimeout(timeout.current);
      timeout.current = null;
      lastPendingArgs.current && storedCallback.current(...lastPendingArgs.current);
      lastPendingArgs.current = null;
    },
    [timeLimit, storedCallback]
  );

  const debouncedCallback = useCallback((...args) => {
    lastPendingArgs.current = args;

    timeout.current && clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      timeout.current = null;
      lastPendingArgs.current && storedCallback.current(...lastPendingArgs.current);
      lastPendingArgs.current = null;
    }, timeLimit);
  }, [timeLimit, storedCallback]);

  if (!debouncedCallback.flush) {
    debouncedCallback.flush = function flush() {
      timeout.current && clearTimeout(timeout.current);
      timeout.current = null;
      lastPendingArgs.current && storedCallback.current(...lastPendingArgs.current);
      lastPendingArgs.current = null;
    };
  }

  return debouncedCallback;
}

export function useOnComponentMounted(callback) {
  const [isCallbackCalled, setIsCallbackCalled] = useState(false);
  useEffect(() => {
    if (!isCallbackCalled) {
      callback();
      setIsCallbackCalled(true);
    }
  }, [callback, isCallbackCalled]);
}

export function useDedupedCallback(callback) {
  const obj = useRef({});
  obj.current.callback = callback;
  obj.current.wrapper = obj.current.wrapper || ((...args) => {
    if (!('lastValue' in obj.current) || !deepEqual(obj.current.lastValue, args)) {
      obj.current.lastValue = args;
      obj.current.callback(...args);
    }
  });
  return obj.current.wrapper;
}
