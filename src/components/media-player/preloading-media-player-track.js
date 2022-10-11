import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import MediaPlayerTrack from './media-player-track.js';
import HttpClient from '../../api-clients/http-client.js';
import { useOnComponentUnmount } from '../../ui/hooks.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { getMediaSourceType } from '../../utils/media-utils.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SCREEN_MODE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

function PreloadingMediaPlayerTrack({
  sourceUrl,
  aspectRatio,
  screenMode,
  screenWidth,
  screenOverlay,
  playbackRange,
  volume,
  posterImageUrl,
  loadImmediately,
  trackRef,
  playbackRate,
  onDuration,
  onProgress,
  onEndReached,
  onPlayStateChange
}) {
  const httpClient = useService(HttpClient);
  const clientConfig = useService(ClientConfig);
  const [objectUrl, setObjectUrl] = useState(null);
  const [loadingSourceUrl, setLastLoadingSourceUrl] = useState(null);

  if (!loadImmediately) {
    throw new Error('Deferred loading is not supported');
  }

  useEffect(() => {
    if (sourceUrl === loadingSourceUrl) {
      return;
    }

    setLastLoadingSourceUrl(sourceUrl);

    (async () => {
      const sourceType = getMediaSourceType({ sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
      const response = await httpClient.get(sourceUrl, {
        responseType: 'blob',
        withCredentials: sourceType === MEDIA_SOURCE_TYPE.internal
      });

      const newObjectUrl = URL.createObjectURL(response.data);

      const oldObjectUrl = objectUrl;

      setObjectUrl(newObjectUrl);

      if (oldObjectUrl) {
        URL.revokeObjectURL(oldObjectUrl);
      }
    })();
  }, [sourceUrl, loadingSourceUrl, objectUrl, httpClient, clientConfig]);

  useOnComponentUnmount(() => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  });

  if (!objectUrl) {
    const throwNotInitialized = () => {
      throw new Error('Track is not initialized');
    };

    trackRef.current = {
      seekToPosition: throwNotInitialized,
      seekToTimecode: throwNotInitialized,
      play: throwNotInitialized,
      pause: throwNotInitialized,
      stop: throwNotInitialized
    };

    return null;
  }

  return (
    <MediaPlayerTrack
      sourceUrl={objectUrl}
      aspectRatio={aspectRatio}
      screenMode={screenMode}
      screenWidth={screenWidth}
      screenOverlay={screenOverlay}
      playbackRange={playbackRange}
      volume={volume}
      posterImageUrl={posterImageUrl}
      loadImmediately={loadImmediately}
      trackRef={trackRef}
      playbackRate={playbackRate}
      onDuration={onDuration}
      onProgress={onProgress}
      onEndReached={onEndReached}
      onPlayStateChange={onPlayStateChange}
      />
  );
}

PreloadingMediaPlayerTrack.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  loadImmediately: PropTypes.bool,
  onDuration: PropTypes.func,
  onEndReached: PropTypes.func,
  onPlayStateChange: PropTypes.func,
  onProgress: PropTypes.func,
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  playbackRate: PropTypes.number,
  posterImageUrl: PropTypes.string,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)).isRequired,
  screenOverlay: PropTypes.node,
  screenWidth: PropTypes.number,
  sourceUrl: PropTypes.string.isRequired,
  trackRef: PropTypes.shape({
    current: PropTypes.any
  }),
  volume: PropTypes.number
};

PreloadingMediaPlayerTrack.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  loadImmediately: false,
  onDuration: () => {},
  onEndReached: () => {},
  onPlayStateChange: () => {},
  onProgress: () => {},
  playbackRange: [0, 1],
  playbackRate: 1,
  posterImageUrl: null,
  screenOverlay: null,
  screenWidth: 100,
  trackRef: {
    current: null
  },
  volume: 1
};

export default PreloadingMediaPlayerTrack;
