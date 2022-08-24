import deepEqual from 'fast-deep-equal';
import { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import MediaDurationCache from './media-duration-cache.js';

export function useMediaDuration(urlOrUrls) {
  const cache = useService(MediaDurationCache);
  const [, setSemaphore] = useState(0);
  const [lastReturnedValue, setLastReturnedValue] = useState(null);

  useEffect(() => {
    const callback = () => setSemaphore(oldValue => oldValue + 1);
    cache.subscribe(callback);
    return () => cache.unsubscribe(callback);
  }, [cache, setSemaphore]);

  const currentValue = Array.isArray(urlOrUrls)
    ? cache.getEntries(urlOrUrls)
    : cache.getEntry(urlOrUrls);

  if (deepEqual(currentValue, lastReturnedValue)) {
    return lastReturnedValue;
  }

  setLastReturnedValue(currentValue);
  return currentValue;
}
