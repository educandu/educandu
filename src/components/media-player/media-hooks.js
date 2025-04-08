import deepEqual from 'fast-deep-equal';
import { useIsMounted } from '../../ui/hooks.js';
import MediaDownloader from './media-downloader.js';
import { useService } from '../container-context.js';
import HttpClient from '../../api-clients/http-client.js';
import MediaDurationCache from './media-duration-cache.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import YoutubeThumbnailUrlCache from './youtube-thumbnail-url-cache.js';
import RunningAudioContextCache from './running-audio-context-cache.js';
import RunningAudioContextProvider from './running-audio-context-provider.js';
import MediaLibraryApiClient from '../../api-clients/media-library-api-client.js';
import { getPortableUrl, isMediaLibrarySourceType } from '../../utils/source-utils.js';

const DEFAULT_RESOLVABLE_MEDIA_LIBRARY_ITEM = { canResolve: true, isResolving: true, resolvedItem: null };
const DEFAULT_UNRESOLVABLE_MEDIA_LIBRARY_ITEM = { canResolve: false, isResolving: false, resolvedItem: null };

export function useResolvedMediaLibraryItemForSource(sourceUrl) {
  const isMountedRef = useIsMounted();
  const clientConfig = useService(ClientConfig);
  const currentSourceUrlRef = useRef(sourceUrl);
  const mediaLibraryApiClient = useSessionAwareApiClient(MediaLibraryApiClient);

  const portableUrl = getPortableUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  currentSourceUrlRef.current = portableUrl;

  const [currentItem, setCurrentItem] = useState(() => {
    return isMediaLibrarySourceType(portableUrl)
      ? DEFAULT_RESOLVABLE_MEDIA_LIBRARY_ITEM
      : DEFAULT_UNRESOLVABLE_MEDIA_LIBRARY_ITEM;
  });

  useEffect(() => {
    if (isMediaLibrarySourceType({ url: portableUrl, cdnRootUrl: clientConfig.cdnRootUrl })) {
      setCurrentItem(DEFAULT_RESOLVABLE_MEDIA_LIBRARY_ITEM);
      (async () => {
        await new Promise(resolve => { setTimeout(resolve, 5000); });
        const foundItem = await mediaLibraryApiClient.findMediaLibraryItem({ url: portableUrl, cached: true });
        if (isMountedRef.current && currentSourceUrlRef.current === portableUrl) {
          setCurrentItem({ ...DEFAULT_RESOLVABLE_MEDIA_LIBRARY_ITEM, isResolving: false, resolvedItem: foundItem });
        }
      })();
    } else {
      setCurrentItem(DEFAULT_UNRESOLVABLE_MEDIA_LIBRARY_ITEM);
    }
  }, [portableUrl, clientConfig.cdnRootUrl, mediaLibraryApiClient, isMountedRef]);

  return currentItem;
}

export function useMediaDurations(urls) {
  const [, setSemaphore] = useState(0);
  const cache = useService(MediaDurationCache);
  const [lastReturnedValue, setLastReturnedValue] = useState(null);

  useEffect(() => {
    const callback = () => setSemaphore(oldValue => oldValue + 1);
    cache.subscribe(callback);
    return () => cache.unsubscribe(callback);
  }, [cache, setSemaphore]);

  const currentValue = cache.getEntries(urls);

  if (deepEqual(currentValue, lastReturnedValue)) {
    return lastReturnedValue;
  }

  setLastReturnedValue(currentValue);
  return currentValue;
}

export function useYoutubeThumbnailUrl(url) {
  const [, setSemaphore] = useState(0);
  const cache = useService(YoutubeThumbnailUrlCache);
  const [lastReturnedValue, setLastReturnedValue] = useState(null);

  useEffect(() => {
    const callback = () => setSemaphore(oldValue => oldValue + 1);
    cache.subscribe(callback);
    return () => cache.unsubscribe(callback);
  }, [cache]);

  const currentValue = cache.getEntry(url);

  if (deepEqual(currentValue, lastReturnedValue)) {
    return lastReturnedValue;
  }

  setLastReturnedValue(currentValue);
  return currentValue;
}

export function useRunningAudioContext() {
  const [, setSemaphore] = useState(0);
  const cache = useService(RunningAudioContextCache);

  useEffect(() => {
    const callback = () => setSemaphore(oldValue => oldValue + 1);
    cache.subscribe(callback);
    return () => cache.unsubscribe(callback);
  }, [cache, setSemaphore]);

  return cache.value;
}

export function useRunningAudioContextProvider() {
  const runningAudioContextCache = useService(RunningAudioContextCache);
  const audioContextProvider = useMemo(() => new RunningAudioContextProvider(runningAudioContextCache), [runningAudioContextCache]);
  return audioContextProvider;
}

export function useMediaDownloader() {
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);
  const mediaDownloader = useMemo(() => new MediaDownloader(httpClient, clientConfig), [httpClient, clientConfig]);
  return mediaDownloader;
}
