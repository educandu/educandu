import Plyr from 'plyr';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useService } from '../../container-context.js';
import { useStableCallback } from '../../../ui/hooks.js';
import { useYoutubeThumbnailUrl } from '../media-hooks.js';
import PlayIcon from '../../icons/media-player/play-icon.js';
import { getSourceType } from '../../../utils/source-utils.js';
import ClientConfig from '../../../bootstrap/client-config.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { memoAndTransformProps } from '../../../ui/react-helper.js';
import {
  SOURCE_TYPE,
  YOUTUBE_STATE,
  MEDIA_ASPECT_RATIO,
  MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS,
} from '../../../domain/constants.js';

function MediaPlayback({
  volume,
  audioOnly,
  sourceUrl,
  aspectRatio,
  playbackRate,
  posterImageUrl,
  mediaPlaybackRef,
  onReady,
  onPlay,
  onPause,
  onEnded,
  onDuration,
  onProgress,
  onBuffering
}) {
  const plyrRef = useRef(null);
  const progressInterval = useRef(null);
  const [player, setPlayer] = useState(null);
  const youtubeThumbnailUrl = useYoutubeThumbnailUrl(sourceUrl);
  const [couldShowOverlay, setCouldShowOverlay] = useState(true);

  const clientConfig = useService(ClientConfig);

  const sourceType = useMemo(() => {
    return getSourceType({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });
  }, [sourceUrl, clientConfig]);

  const setProgressInterval = callback => {
    if (!callback) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
      return;
    }
    progressInterval.current = setInterval(callback, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS);
  };

  useEffect(() => {
    const playerInstance = new Plyr(plyrRef.current, {
      controls: [],
      ratio: aspectRatio,
      clickToPlay: true,
      loadSprite: false,
      fullscreen: { enabled: false, fallback: false },
      // https://developers.google.com/youtube/player_parameters#Parameters
      youtube: { autoplay: 0, rel: 0, fs: 0, showinfo: 0, disablekb: 1, iv_load_policy: 3, modestbranding: 0, controls: 0 }
    });
    setPlayer(playerInstance);
  }, [plyrRef, aspectRatio]);

  useEffect(() => {
    if (player) {
      player.source = {
        type: audioOnly ? 'audio': 'video',
        sources: [{
          src: sourceUrl,
          provider: sourceType === SOURCE_TYPE.youtube ? 'youtube' : 'html5'
        }]
      };
    }
  }, [player, sourceUrl, audioOnly, sourceType]);

  useEffect(() => {
    if (player) {
      player.speed = playbackRate;
    }
  }, [player, playbackRate]);

  useEffect(() => {
    if (player) {
      player.volume = volume;
    }
  }, [player, volume]);

  useEffect(() => {
    if (player) {
      if (posterImageUrl) {
        player.poster = posterImageUrl;
        return;
      }
      if (youtubeThumbnailUrl) {
        player.poster = youtubeThumbnailUrl.isHighResThumbnailUrlVerfied
          ? youtubeThumbnailUrl.highResThumbnailUrl
          : youtubeThumbnailUrl.lowResThumbnailUrl;
      }
    }
  }, [player, audioOnly, posterImageUrl, youtubeThumbnailUrl]);

  useEffect(() => {
    if (player) {
      player.on('loadedmetadata', async () => {
        if (player.duration) {
          onDuration(player.duration * 1000);
        }
      });
      player.on('ready', () => {
        if (player.duration) {
          onDuration(player.duration * 1000);
        }
        onReady();
      });
      player.on('playing', async () => {
        onPlay();
        setCouldShowOverlay(false);
        setProgressInterval(() => onProgress(player.currentTime * 1000));
      });
      player.on('pause', () => {
        setProgressInterval(null);
        setCouldShowOverlay(true);
        onPause();
      });
      player.on('seeking', () => {
        onProgress(player.currentTime * 1000);
      });
      player.on('progress', () => {
        onProgress(player.currentTime * 1000);
      });
      player.on('timeupdate', () => {
        onProgress(player.currentTime * 1000);
      });
      player.on('ended', () => {
        setProgressInterval(null);
        onEnded();
      });
      // youtube-only event
      player.on('statechange', event => {
        onProgress(player.currentTime * 1000);
        if (event.detail.code === YOUTUBE_STATE.buffering) {
          setProgressInterval(null);
          onBuffering();
        }
      });
    }
  }, [player, sourceUrl, onReady, onPlay, onPause, onEnded, onDuration, onProgress, onBuffering]);

  const handleOverlayClick = () => {
    player?.play();
  };

  mediaPlaybackRef.current = useMemo(() => ({
    play: player?.play,
    pause: player?.pause,
    seekToTimecode: milliseconds => {
      if (player) {
        player.currentTime = milliseconds / 1000;
      }
    }
  }), [player]);

  const showOverlay = !audioOnly && sourceType !== SOURCE_TYPE.youtube && couldShowOverlay;

  return (
    <div className={classNames('MediaPlayback', { 'MediaPlayback--audioOnly': audioOnly } )}>
      <video ref={plyrRef} />
      {showOverlay && (
        <div className="MediaPlayback-videoOverlay" onClick={handleOverlayClick} >
          <div className="MediaPlayback-videoOverlayIcon">
            <PlayIcon />
          </div>
        </div>
      )}
    </div>
  );
}

MediaPlayback.propTypes = {
  volume: PropTypes.number.isRequired,
  audioOnly: PropTypes.bool,
  sourceUrl: PropTypes.string.isRequired,
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  onReady: PropTypes.func,
  onPlay: PropTypes.func,
  onPause: PropTypes.func,
  onEnded: PropTypes.func,
  onDuration: PropTypes.func,
  onProgress: PropTypes.func,
  onBuffering: PropTypes.func,
  onBufferingEnded: PropTypes.func,
  playbackRate: PropTypes.number,
  posterImageUrl: PropTypes.string,
  mediaPlaybackRef: PropTypes.shape({
    current: PropTypes.any
  }),
};

MediaPlayback.defaultProps = {
  audioOnly: false,
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  onReady: () => {},
  onPlay: () => {},
  onPause: () => {},
  onEnded: () => {},
  onDuration: () => {},
  onProgress: () => {},
  onBuffering: () => {},
  playbackRate: 1,
  posterImageUrl: null,
  mediaPlaybackRef: {
    current: null
  }
};

export default memoAndTransformProps(MediaPlayback, ({
  onReady,
  onPlay,
  onPause,
  onEnded,
  onDuration,
  onProgress,
  onBuffering,
  ...rest
}) => ({
  onReady: useStableCallback(onReady),
  onPlay: useStableCallback(onPlay),
  onPause: useStableCallback(onPause),
  onEnded: useStableCallback(onEnded),
  onDuration: useStableCallback(onDuration),
  onProgress: useStableCallback(onProgress),
  onBuffering: useStableCallback(onBuffering),
  ...rest
}));
