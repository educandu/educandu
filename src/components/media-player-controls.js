import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Slider } from 'antd';
import MuteIcon from './icons/media-player/mute-icon.js';
import PlayIcon from './icons/media-player/play-icon.js';
import PauseIcon from './icons/media-player/pause-icon.js';
import { MEDIA_PLAY_STATE } from '../domain/constants.js';
import VolumeIcon from './icons/media-player/volume-icon.js';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';

function MediaPlayerControls({
  durationInMilliseconds,
  extraContentTop,
  playedMilliseconds,
  playState,
  volume,
  marks,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onSeek,
  onVolumeChange,
  standalone
}) {
  const isMediaLoaded = !!durationInMilliseconds;
  const showAsPlaying = playState === MEDIA_PLAY_STATE.playing || playState === MEDIA_PLAY_STATE.buffering;

  return (
    <div className={classNames('MediaPlayerControls', { 'MediaPlayerControls--standalone': standalone })}>
      {extraContentTop && (
        <div className="MediaPlayerControls-extraContent MediaPlayerControls-extraContent--top">
          {extraContentTop}
        </div>
      )}
      <div className="MediaPlayerControls-progressSlider">
        <Slider
          min={0}
          max={durationInMilliseconds}
          value={playedMilliseconds}
          marks={isMediaLoaded ? marks : {}}
          tipFormatter={formatMillisecondsAsDuration}
          onChange={onSeek}
          />
      </div>
      <div className="MediaPlayerControls-controls">
        <div className="MediaPlayerControls-controlsGroup">
          <Button type="link" icon={showAsPlaying ? <PauseIcon /> : <PlayIcon />} onClick={onTogglePlay} />
          <div className="MediaPlayerControls-volumeControls">
            <Button type="link" icon={isMuted ? <MuteIcon /> : <VolumeIcon />} onClick={onToggleMute} />
            <Slider
              className="MediaPlayerControls-volumeSlider"
              min={0}
              max={100}
              value={isMuted ? 0 : volume * 100}
              tipFormatter={val => `${val}%`}
              onChange={val => onVolumeChange(val / 100)}
              disabled={isMuted}
              />
          </div>
          <div className="MediaPlayerControls-timeDisplay">{formatMillisecondsAsDuration(playedMilliseconds)}&nbsp;/&nbsp;{formatMillisecondsAsDuration(durationInMilliseconds)}</div>
        </div>
        <div className="MediaPlayerControls-controlsGroup" />
      </div>
    </div>
  );
}

MediaPlayerControls.propTypes = {
  durationInMilliseconds: PropTypes.number.isRequired,
  extraContentTop: PropTypes.node,
  isMuted: PropTypes.bool.isRequired,
  marks: PropTypes.object,
  onSeek: PropTypes.func.isRequired,
  onToggleMute: PropTypes.func.isRequired,
  onTogglePlay: PropTypes.func.isRequired,
  onVolumeChange: PropTypes.func.isRequired,
  playState: PropTypes.oneOf(Object.values(MEDIA_PLAY_STATE)).isRequired,
  playedMilliseconds: PropTypes.number.isRequired,
  standalone: PropTypes.bool,
  volume: PropTypes.number.isRequired
};

MediaPlayerControls.defaultProps = {
  extraContentTop: null,
  marks: {},
  standalone: false
};

export default MediaPlayerControls;
