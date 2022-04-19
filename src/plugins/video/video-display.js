import classNames from 'classnames';
import reactPlayerNs from 'react-player';
import { SOURCE_TYPE } from './constants.js';
import React, { useRef, useState } from 'react';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import MediaControl from '../../components/media-control.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

const PLAY_STATES = {
  initializing: 'initializing',
  buffering: 'buffering',
  stopped: 'stopped',
  playing: 'playing',
  pausing: 'pausing'
};

function VideoDisplay({ content }) {
  const playerRef = useRef();
  const clientConfig = useService(ClientConfig);

  const [volume, setVolume] = useState(1);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [durationInSeconds, setDurationInSeconds] = useState(0);
  const [playState, setPlayState] = useState(PLAY_STATES.initializing);

  const handleReady = () => {
    setPlayState(PLAY_STATES.stopped);
  };

  const handleBuffer = () => {
    setPlayState(PLAY_STATES.buffering);
  };

  const handlePlay = () => {
    setPlayState(PLAY_STATES.playing);
  };

  const handlePause = () => {
    setPlayState(PLAY_STATES.pausing);
  };

  const handleStop = () => {
    setPlayState(PLAY_STATES.stopped);
  };

  const handleMediaControlSeek = percentage => {
    playerRef.current.seekTo(percentage);
  };

  const handleMediaControlTogglePlay = () => {
    setPlayState(() => {
      switch (playState) {
        case PLAY_STATES.initializing:
          return PLAY_STATES.stopped;
        case PLAY_STATES.buffering:
          return PLAY_STATES.buffering;
        case PLAY_STATES.playing:
          return PLAY_STATES.pausing;
        case PLAY_STATES.pausing:
        case PLAY_STATES.stopped:
          return PLAY_STATES.playing;
        default:
          throw new Error(`Invalid play state: ${playState}`);
      }
    });
  };

  const handleProgress = progress => {
    setPlayedSeconds(progress.playedSeconds);
  };

  const handleDuration = duration => {
    setDurationInSeconds(duration);
  };

  const handleVolumeChange = newVolume => {
    setVolume(newVolume);
  };

  const handleClickPreview = () => {
    setPlayState(PLAY_STATES.playing);
  };

  const aspectRatio = content.aspectRatio || { h: 16, v: 9 };
  const paddingTop = `${(aspectRatio.v / aspectRatio.h * 100).toFixed(2)}%`;
  const width = content.width || 100;

  let sourceUrl;
  switch (content.sourceType) {
    case SOURCE_TYPE.internal:
      sourceUrl = content.sourceUrl ? `${clientConfig.cdnRootUrl}/${content.sourceUrl}` : null;
      break;
    default:
      sourceUrl = content.sourceUrl || null;
      break;
  }

  const renderMediaControl = () => {
    const classes = classNames(['VideoDisplay-mediaControlContainer', `u-width-${width}`]);
    return (
      <div className={classes}>
        <MediaControl
          isPlaying={playState === PLAY_STATES.playing}
          durationInSeconds={durationInSeconds}
          playedSeconds={playedSeconds}
          volume={volume}
          onSeek={handleMediaControlSeek}
          onTogglePlay={handleMediaControlTogglePlay}
          onVolumeChange={handleVolumeChange}
          />
      </div>
    );
  };

  const renderMainPlayer = () => {
    const classes = classNames({
      'Video-mainPlayerContainer': true,
      [`u-width-${width}`]: !!content.showVideo,
      'Video-mainPlayerContainer--noDisplay': !content.showVideo
    });

    const posterImageUrl = content.posterImage.sourceUrl ? `${clientConfig.cdnRootUrl}/${content.posterImage.sourceUrl}` : null;

    return (
      <div className={classes}>
        <div className="Video-mainPlayerOuter" style={{ paddingTop }}>
          <ReactPlayer
            ref={playerRef}
            className="Video-mainPlayerInner"
            url={sourceUrl}
            width="100%"
            height="100%"
            controls
            volume={volume}
            progressInterval={100}
            light={posterImageUrl || false}
            playing={playState === PLAY_STATES.playing || playState === PLAY_STATES.buffering}
            onReady={handleReady}
            onBuffer={handleBuffer}
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
  };

  const renderPlayers = () => (
    <div className="Video-players">
      {renderMainPlayer()}
      {sourceUrl && !content.showVideo && renderMediaControl()}
    </div>
  );

  return (
    <div className="Video">
      {sourceUrl && renderPlayers()}
      {content.text && (
        <div className="Video-text">
          <Markdown>{content.text}</Markdown>
        </div>
      )}
    </div>
  );
}

VideoDisplay.propTypes = {
  ...sectionDisplayProps
};

export default VideoDisplay;
