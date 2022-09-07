import PropTypes from 'prop-types';
import classNames from 'classnames';
import reactPlayerNs from 'react-player';
import AudioIcon from '../icons/general/audio-icon.js';
import React, { useEffect, useRef, useState } from 'react';
import { getTrackDurationFromSourceDuration, getSourcePositionFromTrackPosition } from '../../utils/media-utils.js';
import { MEDIA_ASPECT_RATIO, MEDIA_PLAY_STATE, MEDIA_SCREEN_MODE, MEDIA_PROGRESS_INTERVAL_IN_MILLISECONDS } from '../../domain/constants.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const PROGRESS_SLEEP_AFTER_SEEKING_IN_MS = 500;

function MediaPlayerTrack({
  sourceUrl,
  aspectRatio,
  screenMode,
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
  const playerRef = useRef();
  const [sourceDuration, setSourceDuration] = useState(0);
  const [lastSeekTimestamp, setLastSeekTimestamp] = useState(0);
  const [lastProgressTimecode, setLastProgressTimecode] = useState(0);
  const [lastPlaybackRange, setLastPlaybackRange] = useState(playbackRange);
  const [currentPlayState, setCurrentPlayState] = useState(MEDIA_PLAY_STATE.initializing);
  const [lastPlayStateBeforeBuffering, setLastPlayStateBeforeBuffering] = useState(MEDIA_PLAY_STATE.initializing);

  useEffect(() => {
    if (playbackRange[0] !== lastPlaybackRange[0] || playbackRange[1] !== lastPlaybackRange[1]) {
      setLastPlaybackRange(playbackRange);
      onDuration(sourceDuration * (playbackRange[1] - playbackRange[0]));
      setCurrentPlayState(MEDIA_PLAY_STATE.initializing);
      onPlayStateChange?.(MEDIA_PLAY_STATE.initializing);
      playerRef.current.seekTo(playbackRange[0]);
      setLastProgressTimecode(0);
      onProgress?.(0);
    }
  }, [playbackRange, lastPlaybackRange, sourceDuration, currentPlayState, onDuration, onProgress, onPlayStateChange]);

  const changePlayState = newPlayState => {
    setLastPlayStateBeforeBuffering(prev => newPlayState !== MEDIA_PLAY_STATE.buffering ? newPlayState : prev);
    setCurrentPlayState(newPlayState);
    onPlayStateChange?.(newPlayState);
  };

  const changeProgress = newSourceTimecode => {
    const trackStartTimecode = lastPlaybackRange[0] * sourceDuration;
    setLastProgressTimecode(newSourceTimecode);
    onProgress?.(newSourceTimecode - trackStartTimecode);
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
    changePlayState(currentPlayState === MEDIA_PLAY_STATE.initializing ? MEDIA_PLAY_STATE.stopped : currentPlayState);
  };

  const handleBuffer = () => {
    changePlayState(MEDIA_PLAY_STATE.buffering);
  };

  const handleBufferEnd = () => {
    changePlayState(lastPlayStateBeforeBuffering);
  };

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

    if (currentSourceTimestamp > trackStopTimecode && trackStopTimecode !== lastProgressTimecode) {
      setLastPlayStateBeforeBuffering(MEDIA_PLAY_STATE.stopped);
      setCurrentPlayState(MEDIA_PLAY_STATE.stopped);
      changeProgress(trackStopTimecode);
      handleEnded();

      return;
    }

    const millisecondsSinceLastSeek = Date.now() - lastSeekTimestamp;
    if (millisecondsSinceLastSeek > PROGRESS_SLEEP_AFTER_SEEKING_IN_MS && currentPlayState !== MEDIA_PLAY_STATE.buffering) {
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
    { 'MediaPlayerTrack--noScreen': screenMode === MEDIA_SCREEN_MODE.none },
    { 'MediaPlayerTrack--audioMode': screenMode === MEDIA_SCREEN_MODE.audio },
    { 'MediaPlayerTrack--previewMode': screenMode === MEDIA_SCREEN_MODE.preview }
  );

  const playerScreenClasses = classNames(
    'MediaPlayerTrack-screen',
    { 'is-hidden': !!screenOverlay }
  );

  return (
    <div className={classes}>
      <div className="MediaPlayerTrack-aspectRatioContainer" style={{ paddingTop }}>
        <ReactPlayer
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
          light={loadImmediately ? false : currentPlayState === MEDIA_PLAY_STATE.initializing && (posterImageUrl || true)}
          playing={currentPlayState === MEDIA_PLAY_STATE.playing || currentPlayState === MEDIA_PLAY_STATE.buffering}
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
        {screenMode === MEDIA_SCREEN_MODE.audio && currentPlayState !== MEDIA_PLAY_STATE.initializing && (
          <div className="MediaPlayerTrack--audioModeOverlay">
            <AudioIcon />
          </div>
        )}
        {screenOverlay && (
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
  onPlayStateChange: PropTypes.func,
  onProgress: PropTypes.func,
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  playbackRate: PropTypes.number,
  posterImageUrl: PropTypes.string,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)).isRequired,
  screenOverlay: PropTypes.node,
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
  onPlayStateChange: () => {},
  onProgress: () => {},
  playbackRange: [0, 1],
  playbackRate: 1,
  posterImageUrl: null,
  screenOverlay: null,
  trackRef: {
    current: null
  },
  volume: 1
};

export default MediaPlayerTrack;
