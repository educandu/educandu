import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import { Menu, Button, Slider, Dropdown } from 'antd';
import HttpClient from '../api-clients/http-client.js';
import MuteIcon from './icons/media-player/mute-icon.js';
import PlayIcon from './icons/media-player/play-icon.js';
import { MEDIA_PLAY_STATE } from '../domain/constants.js';
import PauseIcon from './icons/media-player/pause-icon.js';
import DownloadIcon from './icons/general/download-icon.js';
import VolumeIcon from './icons/media-player/volume-icon.js';
import SettingsIcon from './icons/main-menu/settings-icon.js';
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
  standalone,
  sourceUrl,
  canDownload
}) {
  const httpClient = useService(HttpClient);
  const { t } = useTranslation('mediaPlayerControls');

  const isMediaLoaded = !!durationInMilliseconds;
  const showAsPlaying = playState === MEDIA_PLAY_STATE.playing || playState === MEDIA_PLAY_STATE.buffering;
  const sliderMarks = marks.reduce((accu, mark) => {
    accu[mark.timecode] = mark.text;
    return accu;
  }, {});

  const handleDownloadClick = () => httpClient.download(sourceUrl);

  const renderSettingsMenu = () => {
    return (
      <Menu>
        <Menu.Item key="moveUp" onClick={handleDownloadClick}>
          <Button type="link" size="small" icon={<DownloadIcon />}>{t('download')}</Button>
        </Menu.Item>
      </Menu>
    );
  };

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
          marks={isMediaLoaded ? sliderMarks : {}}
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
        <div className="MediaPlayerControls-controlsGroup">
          {canDownload && sourceUrl && (
            <Dropdown overlay={renderSettingsMenu} placement="bottomRight" trigger={['click']}>
              <Button type="link" icon={<SettingsIcon />} />
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
}

MediaPlayerControls.propTypes = {
  canDownload: PropTypes.bool,
  durationInMilliseconds: PropTypes.number.isRequired,
  extraContentTop: PropTypes.node,
  isMuted: PropTypes.bool.isRequired,
  marks: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    timecode: PropTypes.number.isRequired,
    text: PropTypes.string
  })),
  onSeek: PropTypes.func.isRequired,
  onToggleMute: PropTypes.func.isRequired,
  onTogglePlay: PropTypes.func.isRequired,
  onVolumeChange: PropTypes.func.isRequired,
  playState: PropTypes.oneOf(Object.values(MEDIA_PLAY_STATE)).isRequired,
  playedMilliseconds: PropTypes.number.isRequired,
  sourceUrl: PropTypes.string,
  standalone: PropTypes.bool,
  volume: PropTypes.number.isRequired
};

MediaPlayerControls.defaultProps = {
  canDownload: false,
  extraContentTop: null,
  marks: [],
  sourceUrl: null,
  standalone: false
};

export default MediaPlayerControls;
