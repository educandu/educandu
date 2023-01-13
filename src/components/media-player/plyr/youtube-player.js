import Plyr from 'plyr';
import PropTypes from 'prop-types';
import { useStableCallback } from '../../../ui/hooks.js';
import PlayIcon from '../../icons/media-player/play-icon.js';
import { memoAndTransformProps } from '../../../ui/react-helper.js';
import { useMediaDurations, useYoutubeThumbnailUrl } from '../media-hooks.js';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS } from '../../../domain/constants.js';

const YOUTUBE_STATE = {
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

  const [endTimeInS, setEndTimeInS] = useState(0);
  const [startTimeInS, setStartTimeInS] = useState(0);
  const [playbackEnded, setPlaybackEnded] = useState(false);
  const [sourceDurationInMs, setSourceDurationInMs] = useState(0);

  const [sourceDurationInfo] = useMediaDurations([sourceUrl]);

  useEffect(() => {
    if (sourceDurationInfo.duration) {
      const calculatedStartTimeInS = Math.trunc((playbackRange[0] * sourceDurationInfo.duration) / 1000);
      const calculatedEndTimeInS = Math.trunc((playbackRange[1] * sourceDurationInfo.duration) / 1000);
      setStartTimeInS(calculatedStartTimeInS);
      setEndTimeInS(calculatedEndTimeInS);

      onDuration((calculatedEndTimeInS - calculatedStartTimeInS) * 1000);
      setSourceDurationInMs(sourceDurationInfo.duration);
    }
  }, [playbackRange, sourceDurationInfo, onDuration]);

  const [player, setPlayer] = useState(null);
  const [showPosterImage, setShowPosterImage] = useState(true);

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
      setShowPosterImage(false);

      if (playbackEnded) {
        player.currentTime = startTimeInS;
        setPlaybackEnded(false);
      }

      player.play();
    }
  }, [player, startTimeInS, playbackEnded, sourceDurationInMs]);

  const triggerPause = useCallback(() => {
    player?.pause();
  }, [player]);

  const triggerSeek = useCallback(seekedTimeWithinRangeInMs => {
    if (player) {
      const startTimeInMs = startTimeInS * 1000;
      const currentActualTimeInMs = startTimeInMs + seekedTimeWithinRangeInMs;
      player.currentTime = currentActualTimeInMs / 1000;

      if (player.paused) {
        const currentTimeWithinRangeInMs = currentActualTimeInMs - startTimeInMs;
        onProgress(currentTimeWithinRangeInMs);
      }
      setPlaybackEnded(false);
    }
  }, [player, startTimeInS, onProgress]);

  const triggerStop = useCallback(() => {
    player?.stop();
  }, [player]);

  const setProgressInterval = callback => {
    clearInterval(progressInterval.current);
    progressInterval.current = null;
    if (callback) {
      progressInterval.current = setInterval(callback, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS);
    }
  };

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
    if (player) {
      player.volume = volume;
    }
  }, [player, volume]);

  const handleEnded = useCallback(() => {
    onEnded();
    setProgressInterval(null);
    setPlaybackEnded(true);
    // compensate for cases where youtube actual source duration is shorter than reported,
    // thus having playback end 1s earlier; likely a rounding issue on their side
    onProgress((endTimeInS - startTimeInS) * 1000);
  }, [startTimeInS, endTimeInS, onProgress, onEnded]);

  const handleProgress = useCallback(() => {
    if (player && !isNaN(player.currentTime)) {
      const currentActualTimeInMs = player.currentTime * 1000;
      const currentTimeWithinRangeInMs = currentActualTimeInMs - (startTimeInS * 1000);
      onProgress(currentTimeWithinRangeInMs);
    }
  }, [player, startTimeInS, onProgress]);

  const handleReady = useCallback(() => {
    onReady();
  }, [onReady]);

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
    seekToTimecode: triggerSeek,
    stop: triggerStop
  }), [triggerPlay, triggerPause, triggerSeek, triggerStop]);

  return (
    <div className="YoutubePlayer">
      <video ref={plyrRef} />
      {!audioOnly && !!posterOrThumbnailImageUrl && !!showPosterImage && (
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
  volume: PropTypes.number,
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
  playbackRate: PropTypes.number,
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  posterImageUrl: PropTypes.string,
  playerRef: PropTypes.shape({
    current: PropTypes.any
  })
};

YoutubePlayer.defaultProps = {
  volume: 1,
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
