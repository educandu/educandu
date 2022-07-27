import PropTypes from 'prop-types';
import classNames from 'classnames';
import reactPlayerNs from 'react-player';
import React, { useRef, useState } from 'react';
import AudioIcon from './icons/general/audio-icon.js';
import { MEDIA_ASPECT_RATIO, MEDIA_PLAY_STATE, MEDIA_SCREEN_MODE } from '../domain/constants.js';
import { getTrackDurationFromSourceDuration, getSourcePositionFromTrackPosition } from '../utils/media-utils.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const PROGRESS_SLEEP_AFTER_SEEKING_IN_MS = 500;

function MediaPlayerTrack({
  sourceUrl,
  aspectRatio,
  screenMode,
  screenOverlay,
  playbackRange,
  progressIntervalInMilliseconds,
  volume,
  isMuted,
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
  const [currentPlayState, setCurrentPlayState] = useState(MEDIA_PLAY_STATE.initializing);

  const changePlayState = newPlayState => {
    setCurrentPlayState(newPlayState);
    onPlayStateChange?.(newPlayState);
  };

  const changeProgress = newSourceTimecode => {
    const trackStartTimecode = playbackRange[0] * sourceDuration;
    setLastProgressTimecode(newSourceTimecode);
    onProgress?.(newSourceTimecode - trackStartTimecode);
  };

  const seekToStartIfNecessary = newSourceDuration => {
    const newTrackStartTimecode = playbackRange[0] * newSourceDuration;
    const newTrackStopTimecode = playbackRange[1] * newSourceDuration;

    if (newSourceDuration && ((lastProgressTimecode < newTrackStartTimecode) || (lastProgressTimecode >= newTrackStopTimecode))) {
      playerRef.current.seekTo(newTrackStartTimecode / newSourceDuration);
    }
  };

  const handleReady = () => {
    changePlayState(currentPlayState === MEDIA_PLAY_STATE.initializing ? MEDIA_PLAY_STATE.stopped : currentPlayState);
  };

  const handleBuffer = () => {
    changePlayState(MEDIA_PLAY_STATE.buffering);
  };

  const handleBufferEnd = () => {
    changePlayState(MEDIA_PLAY_STATE.playing);
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
      const trackStartTimecode = playbackRange[0] * sourceDuration;
      const sourcePosition = getSourcePositionFromTrackPosition(trackPosition, playbackRange);
      const sourceTimecode = sourcePosition * sourceDuration;
      const trackTimecode = sourceTimecode - trackStartTimecode;
      playerRef.current.seekTo(sourcePosition);
      changeProgress(sourceTimecode);
      return { trackPosition, trackTimecode, sourcePosition, sourceTimecode };
    },
    seekToTimecode(trackTimecode) {
      const trackDuration = getTrackDurationFromSourceDuration(sourceDuration, playbackRange);
      return trackRef.current.seekToPosition(trackDuration ? trackTimecode / trackDuration : 0);
    },
    play() {
      changePlayState(MEDIA_PLAY_STATE.playing);
    },
    pause() {
      changePlayState(MEDIA_PLAY_STATE.pausing);
    },
    togglePlay() {
      let newPlayState;
      switch (currentPlayState) {
        case MEDIA_PLAY_STATE.initializing:
          newPlayState = MEDIA_PLAY_STATE.playing;
          break;
        case MEDIA_PLAY_STATE.buffering:
          newPlayState = MEDIA_PLAY_STATE.buffering;
          break;
        case MEDIA_PLAY_STATE.playing:
          newPlayState = MEDIA_PLAY_STATE.pausing;
          break;
        case MEDIA_PLAY_STATE.pausing:
        case MEDIA_PLAY_STATE.stopped:
          newPlayState = MEDIA_PLAY_STATE.playing;
          break;
        default:
          throw new Error(`Invalid play state: ${currentPlayState}`);
      }

      if (newPlayState === MEDIA_PLAY_STATE.playing) {
        seekToStartIfNecessary(sourceDuration);
      }

      changePlayState(newPlayState);
    }
  };

  const handleProgress = progress => {
    const currentSourceTimestamp = progress.played * sourceDuration;
    const trackStopTimecode = playbackRange[1] * sourceDuration;

    if (currentSourceTimestamp > trackStopTimecode) {
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
    const newTrackDuration = (playbackRange[1] - playbackRange[0]) * newSourceDuration;
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

  return (
    <div className={classes}>
      <div className="MediaPlayerTrack-aspectRatioContainer" style={{ paddingTop }}>
        <ReactPlayer
          ref={playerRef}
          className="MediaPlayerTrack-screen"
          url={sourceUrl}
          width="100%"
          height="100%"
          controls={false}
          volume={volume}
          muted={isMuted}
          playbackRate={playbackRate}
          progressInterval={progressIntervalInMilliseconds}
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
  isMuted: PropTypes.bool,
  loadImmediately: PropTypes.bool,
  onDuration: PropTypes.func,
  onEndReached: PropTypes.func,
  onPlayStateChange: PropTypes.func,
  onProgress: PropTypes.func,
  playbackRange: PropTypes.arrayOf(PropTypes.number),
  playbackRate: PropTypes.number,
  posterImageUrl: PropTypes.string,
  progressIntervalInMilliseconds: PropTypes.number.isRequired,
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
  isMuted: false,
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
