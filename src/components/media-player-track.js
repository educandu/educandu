import PropTypes from 'prop-types';
import classNames from 'classnames';
import reactPlayerNs from 'react-player';
import React, { useRef, useState } from 'react';
import { MEDIA_ASPECT_RATIO, MEDIA_PLAY_STATE } from '../domain/constants.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const PROGRESS_SLEEP_AFTER_SEEKING_IN_MS = 500;

function MediaPlayerTrack({
  sourceUrl,
  aspectRatio,
  audioOnly,
  previewMode,
  startTimecode,
  stopTimecode,
  volume,
  isMuted,
  posterImageUrl,
  trackRef,
  onDuration,
  onProgress,
  onPlayStateChange
}) {
  const playerRef = useRef();
  const [lastProgress, setLastProgress] = useState(0);
  const [lastSeekTimestamp, setLastSeekTimestamp] = useState(0);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);
  const [currentPlayState, setCurrentPlayState] = useState(MEDIA_PLAY_STATE.initializing);

  const changePlayState = newPlayState => {
    setCurrentPlayState(newPlayState);
    onPlayStateChange?.(newPlayState);
  };

  const changeProgress = newProgress => {
    setLastProgress(newProgress);
    onProgress?.(newProgress - (startTimecode || 0));
  };

  const seekToStartIfNecessary = duration => {
    if (duration && ((startTimecode && lastProgress < startTimecode) || (stopTimecode && lastProgress >= stopTimecode))) {
      playerRef.current.seekTo((startTimecode || 0) / duration);
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

  const handleStop = () => {
    changePlayState(MEDIA_PLAY_STATE.stopped);
  };

  trackRef.current = {
    seekTo(milliseconds) {
      setLastSeekTimestamp(Date.now());
      const realMilliseconds = milliseconds + (startTimecode || 0);
      playerRef.current.seekTo(realMilliseconds / durationInMilliseconds);
      changeProgress(realMilliseconds);
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
        seekToStartIfNecessary(durationInMilliseconds);
      }

      changePlayState(newPlayState);
    }
  };

  const handleProgress = progress => {
    const progressInMilliseconds = progress.playedSeconds * 1000;
    if (stopTimecode && progressInMilliseconds > stopTimecode) {
      setCurrentPlayState(MEDIA_PLAY_STATE.stopped);
      changeProgress(stopTimecode);
      handleStop?.();
      return;
    }

    const millisecondsSinceLastSeek = Date.now() - lastSeekTimestamp;
    if (millisecondsSinceLastSeek > PROGRESS_SLEEP_AFTER_SEEKING_IN_MS && currentPlayState !== MEDIA_PLAY_STATE.buffering) {
      changeProgress(progressInMilliseconds);
    }
  };

  const handleDuration = duration => {
    const durationInMillis = duration * 1000;
    setDurationInMilliseconds(durationInMillis);
    onDuration?.(Math.min(stopTimecode || Number.MAX_VALUE, durationInMillis) - (startTimecode || 0));
    seekToStartIfNecessary(durationInMillis);
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
    { 'MediaPlayerTrack--noDisplay': audioOnly },
    { 'MediaPlayerTrack--previewMode': previewMode }
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
          progressInterval={100}
          light={currentPlayState === MEDIA_PLAY_STATE.initializing && (posterImageUrl || true)}
          playing={currentPlayState === MEDIA_PLAY_STATE.playing || currentPlayState === MEDIA_PLAY_STATE.buffering}
          onReady={handleReady}
          onBuffer={handleBuffer}
          onBufferEnd={handleBufferEnd}
          onStart={handlePlay}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleStop}
          onDuration={handleDuration}
          onProgress={handleProgress}
          onClickPreview={handleClickPreview}
          />
      </div>
    </div>
  );
}

MediaPlayerTrack.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(MEDIA_ASPECT_RATIO)),
  audioOnly: PropTypes.bool,
  isMuted: PropTypes.bool,
  onDuration: PropTypes.func,
  onPlayStateChange: PropTypes.func,
  onProgress: PropTypes.func,
  posterImageUrl: PropTypes.string,
  previewMode: PropTypes.bool,
  sourceUrl: PropTypes.string.isRequired,
  startTimecode: PropTypes.number,
  stopTimecode: PropTypes.number,
  trackRef: PropTypes.shape({
    current: PropTypes.any
  }),
  volume: PropTypes.number
};

MediaPlayerTrack.defaultProps = {
  aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
  audioOnly: false,
  isMuted: false,
  onDuration: () => {},
  onPlayStateChange: () => {},
  onProgress: () => {},
  posterImageUrl: null,
  previewMode: false,
  startTimecode: null,
  stopTimecode: null,
  trackRef: {
    current: null
  },
  volume: 1
};

export default MediaPlayerTrack;
