import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Slider } from 'antd';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';
import { AudioMutedOutlined, CaretRightOutlined, PauseOutlined, SoundOutlined } from '@ant-design/icons';

function MediaPlayerControls({
  durationInMilliseconds,
  playedMilliseconds,
  isPlaying,
  volume,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onSeek,
  onVolumeChange,
  standalone
}) {
  return (
    <div className={classNames('MediaPlayerControls', { 'MediaPlayerControls--standalone': standalone })}>
      <Slider min={0} max={durationInMilliseconds} value={playedMilliseconds} tipFormatter={formatMillisecondsAsDuration} onChange={onSeek} />
      <div className="MediaPlayerControls-controls">
        <div className="MediaPlayerControls-controlsGroup">
          <Button type="link" icon={isPlaying ? <PauseOutlined /> : <CaretRightOutlined />} onClick={onTogglePlay} />
          <Button type="link" icon={isMuted ? <AudioMutedOutlined /> : <SoundOutlined />} onClick={onToggleMute} />
          <Slider className="MediaPlayerControls-volumeSlider" min={0} max={100} value={volume * 100} tipFormatter={val => `${val}%`} onChange={val => onVolumeChange(val / 100)} />
          <div className="MediaPlayerControls-timeDisplay">{formatMillisecondsAsDuration(playedMilliseconds)}&nbsp;/&nbsp;{formatMillisecondsAsDuration(durationInMilliseconds)}</div>
        </div>
        <div className="MediaPlayerControls-controlsGroup" />
      </div>
    </div>
  );
}

MediaPlayerControls.propTypes = {
  durationInMilliseconds: PropTypes.number.isRequired,
  isMuted: PropTypes.bool.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  onSeek: PropTypes.func.isRequired,
  onToggleMute: PropTypes.func.isRequired,
  onTogglePlay: PropTypes.func.isRequired,
  onVolumeChange: PropTypes.func.isRequired,
  playedMilliseconds: PropTypes.number.isRequired,
  standalone: PropTypes.bool,
  volume: PropTypes.number.isRequired
};

MediaPlayerControls.defaultProps = {
  standalone: false
};

export default MediaPlayerControls;
