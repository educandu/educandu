import deepEqual from 'fast-deep-equal';
import MediaDownloader from './media-downloader.js';
import { useService } from '../container-context.js';
import { useEffect, useState, useMemo } from 'react';
import HttpClient from '../../api-clients/http-client.js';
import MediaDurationCache from './media-duration-cache.js';
import ClientConfig from '../../bootstrap/client-config.js';
import YoutubeThumbnailUrlCache from './youtube-thumbnail-url-cache.js';
import RunningAudioContextCache from './running-audio-context-cache.js';
import RunningAudioContextProvider from './running-audio-context-provider.js';

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
