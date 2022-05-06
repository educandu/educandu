import PropTypes from 'prop-types';
import classNames from 'classnames';
import reactPlayerNs from 'react-player';
import React, { Fragment, useRef, useState } from 'react';
import MediaPlayerControls from './media-player-controls.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const PROGRESS_SLEEP_AFTER_SEEKING_IN_MS = 500;

export const PLAY_STATE = {
  initializing: 'initializing',
  buffering: 'buffering',
  stopped: 'stopped',
  playing: 'playing',
  pausing: 'pausing'
};

export const ASPECT_RATIO = {
  sixteenToNine: '16:9',
  fourToThree: '4:3'
};

function MediaPlayer({ sourceUrl, aspectRatio, audioOnly, posterImageUrl }) {
  const playerRef = useRef();
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [lastSeekTimestamp, setLastSeekTimestamp] = useState(0);
  const [playedMilliseconds, setPlayedMilliseconds] = useState(0);
  const [durationInMilliseconds, setDurationInMilliseconds] = useState(0);
  const [currentPlayState, setCurrentPlayState] = useState(PLAY_STATE.initializing);

  const handleReady = () => {
    setCurrentPlayState(previousValue => previousValue === PLAY_STATE.initializing ? PLAY_STATE.stopped : previousValue);
  };

  const handleBuffer = () => {
    setCurrentPlayState(PLAY_STATE.buffering);
  };

  const handleBufferEnd = () => {
    setCurrentPlayState(PLAY_STATE.playing);
  };

  const handlePlay = () => {
    setCurrentPlayState(PLAY_STATE.playing);
  };

  const handlePause = () => {
    setCurrentPlayState(PLAY_STATE.pausing);
  };

  const handleStop = () => {
    setCurrentPlayState(PLAY_STATE.stopped);
  };

  const handleMediaControlSeek = milliseconds => {
    setLastSeekTimestamp(Date.now());
    setPlayedMilliseconds(milliseconds);
    playerRef.current.seekTo(milliseconds / durationInMilliseconds);
  };

  const handleMediaControlToggleMute = () => {
    setIsMuted(oldValue => !oldValue);
  };

  const handleMediaControlTogglePlay = () => {
    setCurrentPlayState(previousValue => {
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
  };

  const handleProgress = progress => {
    const millisecondsSinceLastSeek = Date.now() - lastSeekTimestamp;
    if (millisecondsSinceLastSeek > PROGRESS_SLEEP_AFTER_SEEKING_IN_MS && currentPlayState !== PLAY_STATE.buffering) {
      setPlayedMilliseconds(progress.playedSeconds * 1000);
    }
  };

  const handleDuration = duration => {
    setDurationInMilliseconds(duration * 1000);
  };

  const handleVolumeChange = newVolume => {
    setVolume(newVolume);
  };

  const handleClickPreview = () => {
    setCurrentPlayState(PLAY_STATE.playing);
  };

  let paddingTop;
  switch (aspectRatio) {
    case ASPECT_RATIO.fourToThree:
      paddingTop = `${(3 / 4 * 100).toFixed(2)}%`;
      break;
    default:
      paddingTop = `${(9 / 16 * 100).toFixed(2)}%`;
      break;
  }

  return (
    <div className="MediaPlayer">
      {!!sourceUrl && (
        <Fragment>
          <div className={classNames({ 'MediaPlayer-playerContainer': true, 'MediaPlayer-playerContainer--noDisplay': audioOnly })}>
            <div className="MediaPlayer-aspectRatioContainer" style={{ paddingTop }}>
              <ReactPlayer
                ref={playerRef}
                className="MediaPlayer-playerScreen"
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
          <div className="MediaPlayer-controlsContainer">
            <MediaPlayerControls
              isMuted={isMuted}
              isPlaying={currentPlayState === PLAY_STATE.playing || currentPlayState === PLAY_STATE.buffering}
              durationInMilliseconds={durationInMilliseconds}
              playedMilliseconds={playedMilliseconds}
              volume={volume}
              onSeek={handleMediaControlSeek}
              onToggleMute={handleMediaControlToggleMute}
              onTogglePlay={handleMediaControlTogglePlay}
              onVolumeChange={handleVolumeChange}
              standalone={audioOnly}
              />
          </div>
        </Fragment>
      )}
    </div>
  );
}

MediaPlayer.propTypes = {
  aspectRatio: PropTypes.oneOf(Object.values(ASPECT_RATIO)),
  audioOnly: PropTypes.bool,
  posterImageUrl: PropTypes.string,
  sourceUrl: PropTypes.string
};

MediaPlayer.defaultProps = {
  aspectRatio: ASPECT_RATIO.sixteenToNine,
  audioOnly: false,
  posterImageUrl: null,
  sourceUrl: null
};

export default MediaPlayer;
