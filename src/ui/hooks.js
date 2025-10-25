import deepEqual from 'fast-deep-equal';
import { delay } from '../utils/time-utils.js';
import { useUser } from '../components/user-context.js';
import { hasUserPermission } from '../domain/permissions.js';
import { useRequest } from '../components/request-context.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LOADING_SPINNER_MINIMUM_PERIOD_IN_MILLISECONDS } from '../domain/constants.js';
import { getCurrentQueryFromLocation, getCurrentUrlFromLocation, isBrowser } from './browser-helper.js';

export function useGetCurrentUrl() {
  const req = useRequest();
  return useMemo(() => () => isBrowser() ? getCurrentUrlFromLocation() : req.originalUrl, [req]);
}

export function useInitialQuery(sanitize = x => x) {
  const request = useRequest();
  const sanitizeRef = useRef(sanitize);
  return useMemo(() => {
    const rawQuery = isBrowser() ? getCurrentQueryFromLocation() : request.query;
    return sanitizeRef.current(rawQuery);
  }, [request, sanitizeRef]);
}

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

export function useLoadingState() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadStartTimestamp, setLoadStartTimestamp] = useState(null);

  const setIsLoadingAfterMinimumPeriod = async newIsLoadingValue => {
    if (newIsLoadingValue) {
      setLoadStartTimestamp(new Date());
      setIsLoading(true);
    } else {
      const loadEndTimestamp = new Date();
      const remainingTimeFromMinimumPeriod = Math.max(
        Math.min(loadEndTimestamp - loadStartTimestamp, LOADING_SPINNER_MINIMUM_PERIOD_IN_MILLISECONDS),
        0
      );

      if (remainingTimeFromMinimumPeriod) {
        await delay(remainingTimeFromMinimumPeriod);
      }
      setIsLoading(false);
    }
  };

  return [
    isLoading,
    setIsLoadingAfterMinimumPeriod
  ];
}

export function useDebouncedFetchingState(initialValue, timeLimit = 250) {
  const [isFetching, setIsFetching] = useState(initialValue);

  const debouncedSetIsFetching = useDebouncedCallback(setIsFetching, timeLimit);

  const conditionallyDebouncedSetIsFetching = useCallback(newIsLoading => {
    if (newIsLoading === true) {
      setIsFetching(true);
    } else {
      debouncedSetIsFetching(false);
    }
  }, [debouncedSetIsFetching]);

  return [
    isFetching,
    conditionallyDebouncedSetIsFetching
  ];
}
