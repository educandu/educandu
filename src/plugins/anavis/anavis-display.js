import classNames from 'classnames';
import reactPlayerNs from 'react-player';
import React, { useRef, useState } from 'react';
import colorHelper from '../../ui/color-helper.js';
import Markdown from '../../components/markdown.js';
import ClientConfig from '../../bootstrap/client-config.js';
import MediaControl from '../../components/media-control.js';
import { useService } from '../../components/container-context.js';
import { MEDIA_KIND, SOURCE_TYPE, PLAY_STATE } from './constants.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';

const ReactPlayer = reactPlayerNs.default || reactPlayerNs;

function AnavisDisplay({ content }) {
  const playerRef = useRef(null);
  const clientConfig = useService(ClientConfig);

  const [volume, setVolume] = useState(1);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [durationInSeconds, setDurationInSeconds] = useState(0);
  const [playState, setPlayState] = useState(PLAY_STATE.initializing);

  const { parts, media } = content;
  const width = content.width || 100;
  const aspectRatio = media.aspectRatio || { h: 16, v: 9 };
  const paddingTop = `${(aspectRatio.v / aspectRatio.h * 100).toFixed(2)}%`;

  let sourceUrl;
  switch (media.sourceType) {
    case SOURCE_TYPE.internal:
      sourceUrl = media.sourceUrl ? `${clientConfig.cdnRootUrl}/${media.sourceUrl}` : null;
      break;
    default:
      sourceUrl = media.sourceUrl || null;
      break;
  }

  const handleReady = () => {
    setPlayState(PLAY_STATE.stopped);
  };

  const handleBuffer = () => {
    setPlayState(PLAY_STATE.buffering);
  };

  const handlePlay = () => {
    setPlayState(PLAY_STATE.playing);
  };

  const handlePause = () => {
    setPlayState(PLAY_STATE.pausing);
  };

  const handleStop = () => {
    setPlayState(PLAY_STATE.stopped);
  };

  const handleMediaControlSeek = percentage => {
    playerRef.current.seekTo(percentage);
  };

  const handleMediaControlTogglePlay = () => {
    setPlayState(() => {
      switch (playState) {
        case PLAY_STATE.initializing:
          return PLAY_STATE.stopped;
        case PLAY_STATE.buffering:
          return PLAY_STATE.buffering;
        case PLAY_STATE.playing:
          return PLAY_STATE.pausing;
        case PLAY_STATE.pausing:
        case PLAY_STATE.stopped:
          return PLAY_STATE.playing;
        default:
          throw new Error(`Invalid play state: ${playState}`);
      }
    });
  };

  const handleProgress = progress => {
    setPlayedSeconds(progress.playedSeconds);
  };

  const handleDuration = newDuration => {
    setDurationInSeconds(newDuration);
  };

  const handleVolumeChange = newVolume => {
    setVolume(newVolume);
  };

  const renderMediaControl = () => {
    const classes = classNames(['AnavisDisplay-mediaControlContainer', `u-width-${width}`]);

    return (
      <div className={classes}>
        <MediaControl
          isPlaying={playState === PLAY_STATE.playing}
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

  const renderMediaPlayer = () => {
    const classes = classNames({
      'Anavis-mainPlayerContainer': true,
      [`u-width-${width}`]: media.kind === MEDIA_KIND.video,
      'Anavis-mainPlayerContainer--noDisplay': media.kind !== MEDIA_KIND.video
    });

    return (
      <div className={classes}>
        <div className="Anavis-mainPlayerOuter" style={{ paddingTop }}>
          <ReactPlayer
            ref={playerRef}
            className="Anavis-mainPlayerInner"
            url={sourceUrl}
            width="100%"
            height="100%"
            controls
            volume={volume}
            progressInterval={100}
            playing={playState === PLAY_STATE.playing || playState === PLAY_STATE.buffering}
            onReady={handleReady}
            onBuffer={handleBuffer}
            onStart={handlePlay}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleStop}
            onDuration={handleDuration}
            onProgress={handleProgress}
            />
        </div>
      </div>
    );
  };

  const renderParts = () => {
    return parts.map((part, index) => (
      <div key={index.toString()} className="Anavis-partOuter" style={{ flex: `${part.length} 0 0%` }}>
        <div className="Anavis-partInner" style={{ color: colorHelper.getContrastColor(part.color), backgroundColor: part.color }} title={part.name}>
          <div className="Anavis-partName">{part.name}</div>
        </div>
      </div>
    ));
  };

  const renderAnnotations = () => {
    const annotationCount = parts.reduce((maxCount, part) => Math.max(maxCount, part.annotations.length), 0);

    return Array.from({ length: annotationCount }, (item, index) => index)
      .map((item, annotationIndex) => (
        <div key={annotationIndex.toString()} className="Anavis-annotation">
          {parts.map((part, partIndex) => (
            <div
              key={partIndex.toString()}
              className="Anavis-annotationItem"
              title={part.annotations[annotationIndex]}
              style={{ flex: `${part.length} 0 0%` }}
              >
              <div className="Anavis-annotationItemText">
                {part.annotations[annotationIndex]}
              </div>
            </div>
          ))}
        </div>
      ));
  };

  return (
    <div className="Anavis">
      <div className="Anavis-row">
        <div className={`Anavis-parts u-width-${width}`}>
          {renderParts()}
        </div>
      </div>
      <div className="Anavis-row">
        <div className={`Anavis-annotations u-width-${width}`}>
          {renderAnnotations()}
        </div>
      </div>
      {sourceUrl && (
        <div className="Anavis-players">
          {renderMediaPlayer()}
          {sourceUrl && media.kind !== MEDIA_KIND.video && renderMediaControl()}
        </div>)}

      {media.text && (
        <div className="Anavis-text">
          <Markdown>{media.text}</Markdown>
        </div>
      )}
    </div>
  );
}

AnavisDisplay.propTypes = {
  ...sectionDisplayProps
};

export default AnavisDisplay;
