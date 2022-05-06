import PropTypes from 'prop-types';
import classNames from 'classnames';
import reactPlayerNs from 'react-player';
import React, { useRef, useState } from 'react';
import { ASPECT_RATIO, PLAY_STATE } from './media-player-constants.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const PROGRESS_SLEEP_AFTER_SEEKING_IN_MS = 500;

function MediaPlayerTrack({ sourceUrl, aspectRatio, audioOnly, volume, isMuted, posterImageUrl, trackRef, onDuration, onProgress, onPlayStateChange }) {
  const playerRef = useRef();
  const [lastSeekTimestamp, setLastSeekTimestamp] = useState(0);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);
  const [currentPlayState, setCurrentPlayState] = useState(PLAY_STATE.initializing);

  const changePlayState = newPlayState => {
    setCurrentPlayState(newPlayState);
    onPlayStateChange?.(newPlayState);
  };

  const handleReady = () => {
    changePlayState(previousValue => previousValue === PLAY_STATE.initializing ? PLAY_STATE.stopped : previousValue);
  };

  const handleBuffer = () => {
    changePlayState(PLAY_STATE.buffering);
  };

  const handleBufferEnd = () => {
    changePlayState(PLAY_STATE.playing);
  };

  const handlePlay = () => {
    changePlayState(PLAY_STATE.playing);
  };

  const handlePause = () => {
    changePlayState(PLAY_STATE.pausing);
  };

  const handleStop = () => {
    changePlayState(PLAY_STATE.stopped);
  };

  trackRef.current = {
    seekTo(milliseconds) {
      setLastSeekTimestamp(Date.now());
      playerRef.current.seekTo(milliseconds / durationInMilliseconds);
      onProgress?.(milliseconds);
    },
    togglePlay() {
      changePlayState(previousValue => {
        switch (previousValue) {
          case PLAY_STATE.initializing:
            return PLAY_STATE.playing;
          case PLAY_STATE.buffering:
            return PLAY_STATE.buffering;
          case PLAY_STATE.playing:
            return PLAY_STATE.pausing;
          case PLAY_STATE.pausing:
          case PLAY_STATE.stopped:
            return PLAY_STATE.playing;
          default:
            throw new Error(`Invalid play state: ${previousValue}`);
        }
      });
    }
  };

  const handleProgress = progress => {
    const millisecondsSinceLastSeek = Date.now() - lastSeekTimestamp;
    if (millisecondsSinceLastSeek > PROGRESS_SLEEP_AFTER_SEEKING_IN_MS && currentPlayState !== PLAY_STATE.buffering) {
      const progressInMilliseconds = progress.playedSeconds * 1000;
      onProgress?.(progressInMilliseconds);
    }
  };

  const handleDuration = duration => {
    const durationInMillis = duration * 1000;
    setDurationInMilliseconds(durationInMillis);
    onDuration?.(durationInMillis);
  };

  const handleClickPreview = () => {
    changePlayState(PLAY_STATE.playing);
  };

  let paddingTop;
  switch (aspectRatio) {
    case ASPECT_RATIO.fourToThree:
      paddingTop = `${(3 / 4 * 100).toFixed(2)}%`;
      break;
    case ASPECT_RATIO.sixteenToNine:
    default:
      paddingTop = `${(9 / 16 * 100).toFixed(2)}%`;
      break;
  }

  return (
    <div className={classNames({ 'MediaPlayerTrack': true, 'MediaPlayerTrack--noDisplay': audioOnly })}>
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
          light={currentPlayState === PLAY_STATE.initializing && (posterImageUrl || true)}
          playing={currentPlayState === PLAY_STATE.playing || currentPlayState === PLAY_STATE.buffering}
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
  aspectRatio: PropTypes.oneOf(Object.values(ASPECT_RATIO)),
  audioOnly: PropTypes.bool,
  isMuted: PropTypes.bool,
  onDuration: PropTypes.func,
  onPlayStateChange: PropTypes.func,
  onProgress: PropTypes.func,
  posterImageUrl: PropTypes.string,
  sourceUrl: PropTypes.string.isRequired,
  trackRef: PropTypes.shape({
    current: PropTypes.any
  }),
  volume: PropTypes.number
};

MediaPlayerTrack.defaultProps = {
  aspectRatio: ASPECT_RATIO.sixteenToNine,
  audioOnly: false,
  isMuted: false,
  onDuration: () => {},
  onPlayStateChange: () => {},
  onProgress: () => {},
  posterImageUrl: null,
  trackRef: {
    current: null
  },
  volume: 1
};

export default MediaPlayerTrack;
