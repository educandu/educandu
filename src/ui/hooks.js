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

function cancelTimeout(timeout) {
  timeout.current && clearTimeout(timeout.current);
  timeout.current = null;
}

function flushPendingArgs(pendingArgs, callback) {
  pendingArgs.current && callback.current(...pendingArgs.current);
  pendingArgs.current = null;
}

export function useDebouncedCallback(callback, timeLimit = 250) {
  const lastPendingArgs = useRef();
  const storedCallback = useRef();
  const timeout = useRef();

  storedCallback.current = callback;

  useEffect(
    () => () => {
      cancelTimeout(timeout);
      flushPendingArgs(lastPendingArgs, storedCallback);
    },
    [timeLimit, storedCallback]
  );

  const debouncedCallback = useCallback((...args) => {
    lastPendingArgs.current = args;
    cancelTimeout(timeout);
    timeout.current = setTimeout(() => {
      timeout.current = null;
      flushPendingArgs(lastPendingArgs, storedCallback);
    }, timeLimit);
  }, [timeLimit, storedCallback]);

  if (!debouncedCallback.flush) {
    debouncedCallback.flush = function flush() {
      cancelTimeout(timeout);
      flushPendingArgs(lastPendingArgs, storedCallback);
    };
  }

  return debouncedCallback;
}

export function useIsMounted() {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
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

export function useOnComponentUnmount(callback) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => () => callbackRef.current?.(), []);
}

export function useDedupedCallback(callback) {
  const obj = useRef({});
  obj.current.callback = callback;

  if (!obj.current.wrapper) {
    obj.current.wrapper = (...args) => {
      if (!('lastValue' in obj.current) || !deepEqual(obj.current.lastValue, args)) {
        obj.current.lastValue = args;
        obj.current.callback(...args);
      }
    };
  }
  return obj.current.wrapper;
}

export function useStableCallback(callback) {
  const callbackRef = useRef();
  callbackRef.current = callback;
  return useCallback((...args) => callbackRef.current?.(...args), [callbackRef]);
}

export function useScrollTopOffset() {
  const [topOffset, setTopOffset] = useState(0);

  const handleScroll = () => {
    setTopOffset(document.documentElement.scrollTop);
  };

  useEffect(() => {
    setTopOffset(document.documentElement.scrollTop);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return topOffset;
}
