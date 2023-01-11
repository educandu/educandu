import Plyr from 'plyr';
import PropTypes from 'prop-types';
import { useStableCallback } from '../../../ui/hooks.js';
import { useYoutubeThumbnailUrl } from '../media-hooks.js';
import PlayIcon from '../../icons/media-player/play-icon.js';
import { memoAndTransformProps } from '../../../ui/react-helper.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS } from '../../../domain/constants.js';

export const YOUTUBE_STATE = {
  unstarted: -1,
  ended: 0,
  playing: 1,
  paused: 2,
  buffering: 3,
  videoCued: 5
};

function YoutubePlayer({
  volume,
  audioOnly,
  sourceUrl,
  aspectRatio,
  playbackRate,
  playbackRange,
  posterImageUrl,
  playerRef,
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
  const youtubeThumbnailUrl = useYoutubeThumbnailUrl(sourceUrl);

  const [player, setPlayer] = useState(null);
  const [showPosterImage, setShowPosterImage] = useState(true);
  const [sourceDurationInMs, setSourceDurationInMs] = useState(0);

  const playbackRangeInMs = useMemo(() => [
    playbackRange[0] * sourceDurationInMs,
    playbackRange[1] * sourceDurationInMs
  ], [playbackRange, sourceDurationInMs]);

  const posterOrThumbnailImageUrl = useMemo(() => {
    if (posterImageUrl) {
      return posterImageUrl;
    }
    if (youtubeThumbnailUrl) {
      return youtubeThumbnailUrl.isHighResThumbnailUrlVerfied
        ? youtubeThumbnailUrl.highResThumbnailUrl
        : youtubeThumbnailUrl.lowResThumbnailUrl;
    }
  }, [posterImageUrl, youtubeThumbnailUrl]);

  const triggerPlay = useCallback(() => {
    if (player && !!sourceDurationInMs) {
      setShowPosterImage(false);
      const currentActualTimeInMs = player.currentTime * 1000;
      const isEndReached = !!playbackRangeInMs[1] && currentActualTimeInMs >= playbackRangeInMs[1];

      if (isEndReached) {
        player.currentTime = playbackRangeInMs[0] / 1000;
      }

      player.play();
    }
  }, [player, sourceDurationInMs, playbackRangeInMs]);

  const triggerPause = useCallback(() => {
    player?.pause();
  }, [player]);

  const triggerSeek = useCallback(milliseconds => {
    if (player) {
      const actualTimeInMs = playbackRangeInMs[0] + milliseconds;
      player.currentTime = actualTimeInMs / 1000;
    }
  }, [player, playbackRangeInMs]);

  const setProgressInterval = callback => {
    clearInterval(progressInterval.current);
    progressInterval.current = null;
    if (callback) {
      progressInterval.current = setInterval(callback, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS);
    }
  };

  useEffect(() => {
    const playerInstance = new Plyr(plyrRef.current, {
      controls: [],
      ratio: aspectRatio,
      clickToPlay: true,
      loadSprite: false,
      blankVideo: null,
      fullscreen: { enabled: false, fallback: false },
      // https://developers.google.com/youtube/player_parameters#Parameters
      youtube: { autoplay: 0, rel: 0, fs: 0, showinfo: 0, disablekb: 1, iv_load_policy: 3, modestbranding: 1, controls: 0 }
    });
    setPlayer(playerInstance);
  }, [plyrRef, aspectRatio]);

  useEffect(() => {
    if (player) {
      player.source = {
        type: audioOnly ? 'audio': 'video',
        sources: [{ src: sourceUrl,  provider: 'youtube' }]
      };
    }
  }, [player, sourceUrl, audioOnly]);

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
    if (player && playbackRangeInMs[0] > 0) {
      player.currentTime = playbackRangeInMs[0] / 1000;
    }
  }, [player, playbackRangeInMs]);

  const handleEnded = useCallback(() => {
    setProgressInterval(null);
    onEnded();
  }, [onEnded]);

  const handleProgress = useCallback(() => {
    if (player && sourceDurationInMs) {
      const currentActualTimeInMs = player.currentTime * 1000;
      const isEndReached = currentActualTimeInMs >= playbackRangeInMs[1];

      if (!isEndReached) {
        const currentTimeWithinRangeInMs = currentActualTimeInMs - playbackRangeInMs[0];
        onProgress(currentTimeWithinRangeInMs);
        return;
      }

      triggerPause();

      const endTimeWithinRangeInMs = playbackRangeInMs[1] - playbackRangeInMs[0];
      onProgress(endTimeWithinRangeInMs);

      handleEnded();
    }
  }, [player, sourceDurationInMs, playbackRangeInMs, onProgress, triggerPause, handleEnded]);

  const handleDuration = useCallback(() => {
    if (player.duration) {
      const actualDurationInMs = player.duration * 1000;
      const playbackDurationInMs = actualDurationInMs * (playbackRange[1] - playbackRange[0]);
      setSourceDurationInMs(actualDurationInMs);
      onDuration(playbackDurationInMs);
    }
  }, [player, playbackRange, onDuration]);

  const handleReady = useCallback(() => {
    handleDuration();
    onReady();
  }, [handleDuration, onReady]);

  const handlePlaying = useCallback(() => {
    onPlay();
    setProgressInterval(() => handleProgress());
  }, [onPlay, handleProgress]);

  const handlePause = useCallback(() => {
    setProgressInterval(null);
    onPause();
  }, [onPause]);

  const handleYoutubeStateChange = useCallback(event => {
    // this call is essential for manual seeking, so that we have the latest progress reported on any state change
    handleProgress();

    if (event.detail.code === YOUTUBE_STATE.playing) {
      handlePlaying();
    }
    if (event.detail.code === YOUTUBE_STATE.paused) {
      handlePause();
    }
    if (event.detail.code === YOUTUBE_STATE.ended) {
      handleEnded();
    }
    if (event.detail.code === YOUTUBE_STATE.buffering) {
      setProgressInterval(null);
      onBuffering();
    }
  }, [handlePlaying, handlePause, handleEnded, handleProgress, onBuffering]);

  useEffect(() => {
    if (player) {
      player.off('ready', handleReady);
      player.on('ready', handleReady);

      player.off('progress', handleProgress);
      player.on('progress', handleProgress);

      player.off('timeupdate', handleProgress);
      player.on('timeupdate', handleProgress);

      player.off('statechange', handleYoutubeStateChange);
      player.on('statechange', handleYoutubeStateChange);
    }
  }, [player, handleReady, handleProgress, handleYoutubeStateChange]);

  playerRef.current = useMemo(() => ({
    play: triggerPlay,
    pause: triggerPause,
    seekToTimecode: triggerSeek
  }), [triggerPlay, triggerPause, triggerSeek]);

  return (
    <div className='YoutubePlayer'>
      <video ref={plyrRef} />
      {!audioOnly && !!posterOrThumbnailImageUrl && !!showPosterImage && (
        <div
          onClick={triggerPlay}
          className="YoutubePlayer-posterImage"
          style={{ backgroundImage: `url(${posterOrThumbnailImageUrl})` }}
          >
          {!!sourceDurationInMs && (
            <div className='YoutubePlayer-playIcon'>
              <PlayIcon />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

YoutubePlayer.propTypes = {
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
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  posterImageUrl: PropTypes.string,
  playerRef: PropTypes.shape({
    current: PropTypes.any
  }),
};

YoutubePlayer.defaultProps = {
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
  playbackRange: [0, 1],
  posterImageUrl: null,
  playerRef: {
    current: null
  }
};

export default memoAndTransformProps(YoutubePlayer, ({
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
