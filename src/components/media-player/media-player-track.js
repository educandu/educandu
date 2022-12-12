import PropTypes from 'prop-types';
import classNames from 'classnames';
import reactPlayerNs from 'react-player';
import { useStableCallback } from '../../ui/hooks.js';
import AudioIcon from '../icons/general/audio-icon.js';
import { useYoutubeThumbnailUrl } from './media-hooks.js';
import React, { useEffect, useRef, useState } from 'react';
import { getTrackDurationFromSourceDuration, getSourcePositionFromTrackPosition } from '../../utils/media-utils.js';
import { MEDIA_ASPECT_RATIO, MEDIA_PLAY_STATE, MEDIA_SCREEN_MODE, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS } from '../../domain/constants.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const PROGRESS_SLEEP_AFTER_SEEKING_IN_MS = 500;

function MediaPlayerTrack({
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
  onInvalidStateReached,
  onPlayStateChange
}) {
  const playerRef = useRef();
  const isMounted = useRef(false);
  const [sourceDuration, setSourceDuration] = useState(0);
  const youtubeThumbnailUrl = useYoutubeThumbnailUrl(sourceUrl);
  const [lastSeekTimestamp, setLastSeekTimestamp] = useState(0);
  const [lastProgressTimecode, setLastProgressTimecode] = useState(0);
  const [lastPlaybackRange, setLastPlaybackRange] = useState(playbackRange);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [trackPlayState, setTrackPlayState] = useState({
    current: MEDIA_PLAY_STATE.initializing,
    beforeBuffering: MEDIA_PLAY_STATE.initializing
  });

  useEffect(() => {
    if (playbackRange[0] !== lastPlaybackRange[0] || playbackRange[1] !== lastPlaybackRange[1]) {
      setLastPlaybackRange(playbackRange);
      onDuration(sourceDuration * (playbackRange[1] - playbackRange[0]));

      setTrackPlayState({
        current: MEDIA_PLAY_STATE.initializing,
        beforeBuffering: MEDIA_PLAY_STATE.initializing
      });

      onPlayStateChange?.(MEDIA_PLAY_STATE.initializing);
      playerRef.current.seekTo(playbackRange[0]);
      setLastProgressTimecode(0);
      onProgress?.(0);
    }
  }, [playbackRange, lastPlaybackRange, sourceDuration, trackPlayState, onDuration, onProgress, onPlayStateChange]);

  const changeProgress = newSourceTimecode => {
    const trackStartTimecode = lastPlaybackRange[0] * sourceDuration;
    setLastProgressTimecode(newSourceTimecode);
    onProgress?.(newSourceTimecode - trackStartTimecode);
  };

  const changePlayState = newPlayState => {
    if (newPlayState === MEDIA_PLAY_STATE.pausing) {
      const sourceTimecode = playerRef.current.getCurrentTime() * 1000;
      changeProgress(sourceTimecode);
    }
    const beforeBuffering = newPlayState === MEDIA_PLAY_STATE.buffering ? trackPlayState.beforeBuffering : newPlayState;
    setTrackPlayState({ current: newPlayState, beforeBuffering });
    onPlayStateChange?.(newPlayState);
  };

  const seekToStartIfNecessary = newSourceDuration => {
    if (!newSourceDuration) {
      return false;
    }

    const newTrackStartTimecode = lastPlaybackRange[0] * newSourceDuration;
    const newTrackStopTimecode = lastPlaybackRange[1] * newSourceDuration;

    if ((lastProgressTimecode < newTrackStartTimecode) || (lastProgressTimecode >= newTrackStopTimecode)) {
      playerRef.current.seekTo(newTrackStartTimecode / newSourceDuration);
      return true;
    }

    return false;
  };

  const handleReady = () => {
    const newPlayState = trackPlayState.current === MEDIA_PLAY_STATE.initializing ? MEDIA_PLAY_STATE.stopped : trackPlayState.current;
    changePlayState(newPlayState);
  };

  const handleBuffer = () => {
    changePlayState(MEDIA_PLAY_STATE.buffering);
  };

  // This workaround fixes a react-player bug in which the bufferEnd callback is not updated
  const handleBufferEnd = useStableCallback(() => {
    if (trackPlayState.current === MEDIA_PLAY_STATE.buffering) {
      changePlayState(trackPlayState.beforeBuffering);
    }
  });

  const handlePlay = () => {
    changePlayState(MEDIA_PLAY_STATE.playing);
  };

  const handlePause = () => {
    changePlayState(MEDIA_PLAY_STATE.pausing);
  };

  const handleEnded = () => {
    onEndReached();
    changePlayState(MEDIA_PLAY_STATE.stopped);
  };

  trackRef.current = {
    seekToPosition(trackPosition) {
      setLastSeekTimestamp(Date.now());
      const trackStartTimecode = lastPlaybackRange[0] * sourceDuration;
      const sourcePosition = getSourcePositionFromTrackPosition(trackPosition, lastPlaybackRange);
      const sourceTimecode = sourcePosition * sourceDuration;
      const trackTimecode = sourceTimecode - trackStartTimecode;
      playerRef.current.seekTo(sourcePosition);
      changeProgress(sourceTimecode);
      return { trackPosition, trackTimecode, sourcePosition, sourceTimecode };
    },
    seekToTimecode(trackTimecode) {
      const trackDuration = getTrackDurationFromSourceDuration(sourceDuration, lastPlaybackRange);
      return trackRef.current.seekToPosition(trackDuration ? trackTimecode / trackDuration : 0);
    },
    play() {
      const hasRestarted = seekToStartIfNecessary(sourceDuration);
      changePlayState(MEDIA_PLAY_STATE.playing);
      return { hasRestarted };
    },
    pause() {
      changePlayState(MEDIA_PLAY_STATE.pausing);
    },
    stop() {
      changePlayState(MEDIA_PLAY_STATE.stopped);
      trackRef.current.seekToPosition(0);
    }
  };

  const handleProgress = progress => {
    const currentSourceTimestamp = progress.played * sourceDuration;
    const trackStopTimecode = lastPlaybackRange[1] * sourceDuration;

    // This unbexpected case only occurs when the react-player has loaded, played and paused a youtube resource
    // and then the DOM element is moved (by swapping section positions).
    // In this case the react-player automatically plays, disregarding the value passed to the "playing" prop.
    // Therefore we have to inform the parent player about the internal state damage and reload the whole player.
    if (trackPlayState.current === MEDIA_PLAY_STATE.pausing && progress.played === 0) {
      playerRef.current.getInternalPlayer()?.pauseVideo();
      onInvalidStateReached();
      return;
    }

    if (currentSourceTimestamp > trackStopTimecode && trackStopTimecode !== lastProgressTimecode) {
      setTrackPlayState({
        current: MEDIA_PLAY_STATE.stopped,
        beforeBuffering: MEDIA_PLAY_STATE.stopped
      });
      changeProgress(trackStopTimecode);
      handleEnded();

      return;
    }

    const millisecondsSinceLastSeek = Date.now() - lastSeekTimestamp;
    if (millisecondsSinceLastSeek > PROGRESS_SLEEP_AFTER_SEEKING_IN_MS && trackPlayState.current !== MEDIA_PLAY_STATE.buffering) {
      changeProgress(currentSourceTimestamp);
    }
  };

  const handleDuration = sourceDurationInSeconds => {
    const newSourceDuration = sourceDurationInSeconds * 1000;
    const newTrackDuration = (lastPlaybackRange[1] - lastPlaybackRange[0]) * newSourceDuration;
    setSourceDuration(newSourceDuration);
    onDuration(newTrackDuration);
    seekToStartIfNecessary(newSourceDuration);
  };

  const handleClickPreview = () => {
    changePlayState(MEDIA_PLAY_STATE.playing);
  };

  let paddingTop;
  switch (aspectRatio) {
    case MEDIA_ASPECT_RATIO.fourToThree:
      paddingTop = `${(3 / 4 * 100).toFixed(2)}%`;
      break;
    case MEDIA_ASPECT_RATIO.sixteenToNine:
    default:
      paddingTop = `${(9 / 16 * 100).toFixed(2)}%`;
      break;
  }

  const classes = classNames(
    'MediaPlayerTrack',
    `u-width-${screenWidth}`,
    { 'MediaPlayerTrack--noScreen': screenMode === MEDIA_SCREEN_MODE.none },
    { 'MediaPlayerTrack--audioMode': screenMode === MEDIA_SCREEN_MODE.audio },
    { 'MediaPlayerTrack--overlayMode': screenMode === MEDIA_SCREEN_MODE.overlay }
  );

  const playerScreenClasses = classNames(
    'MediaPlayerTrack-screen',
    { 'is-hidden': screenMode === MEDIA_SCREEN_MODE.overlay }
  );

  const isBufferingWhilePlaying = trackPlayState.current === MEDIA_PLAY_STATE.buffering && trackPlayState.beforeBuffering === MEDIA_PLAY_STATE.playing;
  const shouldPlay = trackPlayState.current === MEDIA_PLAY_STATE.playing || isBufferingWhilePlaying;

  let lightModeValue;
  if (trackPlayState.current !== MEDIA_PLAY_STATE.initializing || loadImmediately) {
    lightModeValue = false;
  } else if (posterImageUrl) {
    lightModeValue = posterImageUrl;
  } else if (youtubeThumbnailUrl) {
    lightModeValue = youtubeThumbnailUrl.isHighResThumbnailUrlVerfied
      ? youtubeThumbnailUrl.highResThumbnailUrl
      : youtubeThumbnailUrl.lowResThumbnailUrl;
  } else {
    lightModeValue = true;
  }

  return (
    <div className={classes}>
      <div className="MediaPlayerTrack-aspectRatioContainer" style={{ paddingTop }}>
        {isMounted.current
          ? <ReactPlayer
              ref={playerRef}
              className={playerScreenClasses}
              url={sourceUrl}
              width="100%"
              height="100%"
              controls={false}
              volume={volume}
              muted={volume === 0}
              playbackRate={playbackRate}
              progressInterval={MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS}
              light={lightModeValue}
              playing={shouldPlay}
              onReady={handleReady}
              onBuffer={handleBuffer}
              onBufferEnd={handleBufferEnd}
              onStart={handlePlay}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onDuration={handleDuration}
              onProgress={handleProgress}
              onClickPreview={handleClickPreview}
              />
          : null}
        {screenMode === MEDIA_SCREEN_MODE.audio && trackPlayState.current !== MEDIA_PLAY_STATE.initializing && (
        <div className="MediaPlayerTrack--audioModeOverlay">
          <AudioIcon />
        </div>
        )}
        {(screenMode === MEDIA_SCREEN_MODE.overlay || !!screenOverlay) && (
        <div className="MediaPlayerTrack--screenOverlay">
          {screenOverlay}
        </div>
        )}
      </div>
    </div>
  );
}

MediaPlayerTrack.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  loadImmediately: PropTypes.bool,
  onDuration: PropTypes.func,
  onEndReached: PropTypes.func,
  onInvalidStateReached: PropTypes.func,
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

MediaPlayerTrack.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  loadImmediately: false,
  onDuration: () => {},
  onEndReached: () => {},
  onInvalidStateReached: () => {},
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

export default MediaPlayerTrack;
