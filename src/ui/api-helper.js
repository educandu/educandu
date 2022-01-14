import { useMemo } from 'react';
import { ERROR_CODES } from '../domain/constants.js';
import { useDialogs } from '../components/dialog-context.js';
import { useService } from '../components/container-context.js';

export async function tryApiCallWithLoginFallback({ executeCall, onLoginRequested }) {
  let result = null;

  let firstTryError = null;
  try {
    result = await executeCall();
  } catch (err) {
    firstTryError = err;
  }

  if (!firstTryError) {
    return result;
  }

  if (firstTryError?.code !== ERROR_CODES.sessionExpired) {
    throw firstTryError;
  }

  const shouldRetry = await onLoginRequested();
  if (!shouldRetry) {
    const cancellationError = new Error('Operation cancelled');
    cancellationError.code = ERROR_CODES.operationCancelled;
    throw cancellationError;
  }

  let secondTryError = null;
  try {
    result = await executeCall();
  } catch (err) {
    secondTryError = err;
  }

  if (!secondTryError) {
    return result;
  }

  throw secondTryError;
}

function handleLoginRequested(dialogs) {
  return new Promise(resolve => {
    dialogs.reloginAfterSessionExpired(() => resolve(true), () => resolve(false));
  });
}

function createFunctionProxy(func, dialogs) {
  return new Proxy(func, {
    apply(target, thisArg, argumentsList) {
      return tryApiCallWithLoginFallback({
        executeCall: () => target.apply(thisArg, argumentsList),
        onLoginRequested: () => handleLoginRequested(dialogs)
      });
    }
  });
}

function createObjectProxy(obj, dialogs) {
  return new Proxy(obj, {
    get(target, key) {
      return typeof target[key] === 'function'
        ? createFunctionProxy(target[key], dialogs)
        : target[key];
    }
  });
}

export function useSessionAwareApiClient(clientType) {
  const dialogs = useDialogs();
  const client = useService(clientType);
  const proxy = useMemo(() => createObjectProxy(client, dialogs), [client, dialogs]);
  return proxy;
}
