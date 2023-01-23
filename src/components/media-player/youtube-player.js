import Plyr from 'plyr';
import PropTypes from 'prop-types';
import { useStableCallback } from '../../ui/hooks.js';
import PlayIcon from '../icons/media-player/play-icon.js';
import { memoAndTransformProps } from '../../ui/react-helper.js';
import { useMediaDurations, useYoutubeThumbnailUrl } from './media-hooks.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS } from '../../domain/constants.js';

const YOUTUBE_STATE = {
  unstarted: -1,
  ended: 0,
  playing: 1,
  paused: 2,
  buffering: 3,
  videoCued: 5
};

function YoutubePlayer({
  aspectRatio,
  audioOnly,
  playbackRange,
  playbackRate,
  playerRef,
  posterImageUrl,
  sourceUrl,
  volume,
  onDuration,
  onEnded,
  onPause,
  onPlay,
  onProgress,
  onReady
}) {
  const plyrRef = useRef(null);
  const progressInterval = useRef(null);
  const youtubeThumbnailUrl = useYoutubeThumbnailUrl(sourceUrl);

  const [endTimeInS, setEndTimeInS] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTimeInS, setStartTimeInS] = useState(0);
  const [sourceDurationInMs, setSourceDurationInMs] = useState(0);
  const [lastPlaybackRange, setLastPlaybackRange] = useState(null);

  const [sourceDurationInfo] = useMediaDurations([sourceUrl]);

  const [player, setPlayer] = useState(null);
  const [wasPlayTriggeredOnce, setWasPlayTriggeredOnce] = useState(false);

  const posterOrThumbnailImageUrl = useMemo(() => {
    if (posterImageUrl) {
      return posterImageUrl;
    }
    if (youtubeThumbnailUrl) {
      return youtubeThumbnailUrl.isHighResThumbnailUrlVerfied
        ? youtubeThumbnailUrl.highResThumbnailUrl
        : youtubeThumbnailUrl.lowResThumbnailUrl;
    }
    return null;
  }, [posterImageUrl, youtubeThumbnailUrl]);

  const triggerPlay = useCallback(() => {
    if (player && !!sourceDurationInMs) {
      setWasPlayTriggeredOnce(true);

      const isCurrentTimeOutsideRange
        = (!!startTimeInS && player.currentTime < startTimeInS)
        || (!!endTimeInS && player.currentTime >= endTimeInS);

      if (isCurrentTimeOutsideRange) {
        player.currentTime = startTimeInS;
      }

      player.play();
    }
  }, [player, startTimeInS, endTimeInS, sourceDurationInMs]);

  const triggerPause = useCallback(() => {
    player?.pause();
  }, [player]);

  const triggerSeek = useCallback(seekedTimeWithinRangeInMs => {
    if (player) {
      const startTimeInMs = startTimeInS * 1000;
      const currentActualTimeInMs = startTimeInMs + seekedTimeWithinRangeInMs;
      player.currentTime = currentActualTimeInMs / 1000;

      if (!isPlaying) {
        const currentTimeWithinRangeInMs = currentActualTimeInMs - startTimeInMs;
        onProgress(currentTimeWithinRangeInMs);
      }
    }
  }, [player, isPlaying, startTimeInS, onProgress]);

  const triggerStop = useCallback(() => {
    player?.stop();
  }, [player]);

  const triggerReset = useCallback(() => {
    triggerSeek(startTimeInS);
    player?.stop();
  }, [player, startTimeInS, triggerSeek]);

  const setProgressInterval = callback => {
    clearInterval(progressInterval.current);
    progressInterval.current = null;
    if (callback) {
      progressInterval.current = setInterval(callback, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS);
    }
  };

  useEffect(() => {
    const playbackRangeChanged = !lastPlaybackRange || playbackRange[0] !== lastPlaybackRange[0] || playbackRange[1] !== lastPlaybackRange[1];
    if (sourceDurationInfo.duration && playbackRangeChanged) {
      setLastPlaybackRange(playbackRange);
      triggerSeek(0);
      const calculatedStartTimeInS = Math.trunc((playbackRange[0] * sourceDurationInfo.duration) / 1000);
      const calculatedEndTimeInS = Math.trunc((playbackRange[1] * sourceDurationInfo.duration) / 1000);
      setStartTimeInS(calculatedStartTimeInS);
      setEndTimeInS(calculatedEndTimeInS);

      onDuration((calculatedEndTimeInS - calculatedStartTimeInS) * 1000);
      setSourceDurationInMs(sourceDurationInfo.duration);
    }
  }, [playbackRange, lastPlaybackRange, sourceDurationInfo, onDuration, triggerSeek]);

  useEffect(() => {
    if (!sourceDurationInMs) {
      return;
    }
    const options = {
      controls: [],
      ratio: aspectRatio,
      clickToPlay: true,
      loadSprite: false,
      blankVideo: '',
      fullscreen: { enabled: false, fallback: false },
      // https://developers.google.com/youtube/player_parameters#Parameters
      youtube: {
        autoplay: 0,
        rel: 0,
        fs: 0,
        showinfo: 0,
        disablekb: 1,
        // eslint-disable-next-line camelcase
        iv_load_policy: 3,
        modestbranding: 1,
        controls: 0
      }
    };

    if (startTimeInS) {
      options.youtube.start = startTimeInS;
    }

    if (endTimeInS) {
      options.youtube.end = endTimeInS;
    }

    const playerInstance = new Plyr(plyrRef.current, options);
    setPlayer(playerInstance);
  }, [plyrRef, aspectRatio, sourceDurationInMs, startTimeInS, endTimeInS]);

  useEffect(() => {
    if (player) {
      player.source = {
        type: audioOnly ? 'audio' : 'video',
        sources: [{ src: sourceUrl, provider: 'youtube' }]
      };
    }
  }, [player, sourceUrl, audioOnly]);

  useEffect(() => {
    if (player) {
      player.speed = playbackRate;
    }
  }, [player, playbackRate]);

  useEffect(() => {
    if (player && wasPlayTriggeredOnce) {
      player.volume = volume;
    }
  }, [player, volume, wasPlayTriggeredOnce]);

  const handleEnded = useCallback(() => {
    onEnded();
    setIsPlaying(false);
    setProgressInterval(null);

    // compensate for cases where youtube actual source duration is shorter than reported,
    // thus having playback end 1s earlier; likely a rounding issue on their side
    onProgress((endTimeInS - startTimeInS) * 1000);
  }, [startTimeInS, endTimeInS, onProgress, onEnded]);

  const handleProgress = useCallback(() => {
    if (player && !isNaN(player.currentTime)) {
      const currentActualTimeInMs = player.currentTime * 1000;
      const currentTimeWithinRangeInMs = currentActualTimeInMs - (startTimeInS * 1000);

      if (player.currentTime <= endTimeInS) {
        onProgress(currentTimeWithinRangeInMs);
        return;
      }

      triggerPause();

      const endTimeWithinRangeInS = endTimeInS - startTimeInS;
      onProgress(endTimeInS - endTimeWithinRangeInS);

      handleEnded();
    }
  }, [player, startTimeInS, endTimeInS, triggerPause, onProgress, handleEnded]);

  const handleReady = useCallback(() => {
    onReady();
  }, [onReady]);

  const handlePlaying = useCallback(() => {
    onPlay();
    setIsPlaying(true);
    setProgressInterval(() => handleProgress());
  }, [onPlay, handleProgress]);

  const handlePause = useCallback(() => {
    onPause();
    setIsPlaying(false);
    setProgressInterval(null);
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
    }
  }, [handlePlaying, handlePause, handleEnded, handleProgress]);

  useEffect(() => {
    if (player) {
      player.once('ready', handleReady);

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
    seekToTimecode: triggerSeek,
    stop: triggerStop,
    reset: triggerReset
  }), [triggerPlay, triggerPause, triggerSeek, triggerStop, triggerReset]);

  return (
    <div className="YoutubePlayer">
      <video ref={plyrRef} />
      {!audioOnly && !!posterOrThumbnailImageUrl && !isPlaying && (
        <div
          onClick={triggerPlay}
          className="YoutubePlayer-posterImage"
          style={{ backgroundImage: `url(${posterOrThumbnailImageUrl})` }}
          >
          {!!sourceDurationInMs && (
            <div className="YoutubePlayer-playIcon">
              <PlayIcon />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

YoutubePlayer.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  audioOnly: PropTypes.bool,
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  playbackRate: PropTypes.number,
  playerRef: PropTypes.shape({
    current: PropTypes.any
  }),
  posterImageUrl: PropTypes.string,
  sourceUrl: PropTypes.string.isRequired,
  volume: PropTypes.number,
  onDuration: PropTypes.func,
  onEnded: PropTypes.func,
  onPause: PropTypes.func,
  onPlay: PropTypes.func,
  onProgress: PropTypes.func,
  onReady: PropTypes.func
};

YoutubePlayer.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  audioOnly: false,
  playbackRange: [0, 1],
  playbackRate: 1,
  playerRef: {
    current: null
  },
  posterImageUrl: null,
  volume: 1,
  onDuration: () => {},
  onEnded: () => {},
  onPause: () => {},
  onPlay: () => {},
  onProgress: () => {},
  onReady: () => {}
};

export default memoAndTransformProps(YoutubePlayer, ({
  onDuration,
  onEnded,
  onPause,
  onPlay,
  onProgress,
  onReady,
  ...rest
}) => ({
  onDuration: useStableCallback(onDuration),
  onEnded: useStableCallback(onEnded),
  onPause: useStableCallback(onPause),
  onPlay: useStableCallback(onPlay),
  onProgress: useStableCallback(onProgress),
  onReady: useStableCallback(onReady),
  ...rest
}));
