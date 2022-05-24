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
  playedMilliseconds,
  playState,
  volume,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  audioOnly,
  sourceUrl,
  canDownload
}) {
  const httpClient = useService(HttpClient);
  const { t } = useTranslation('mediaPlayerControls');

  const showAsPlaying = playState === MEDIA_PLAY_STATE.playing || playState === MEDIA_PLAY_STATE.buffering;

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
    <div className={classNames('MediaPlayerControls', { 'MediaPlayerControls--audioOnly': audioOnly })}>
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
  );
}

MediaPlayerControls.propTypes = {
  audioOnly: PropTypes.bool,
  canDownload: PropTypes.bool,
  durationInMilliseconds: PropTypes.number.isRequired,
  isMuted: PropTypes.bool.isRequired,
  onToggleMute: PropTypes.func.isRequired,
  onTogglePlay: PropTypes.func.isRequired,
  onVolumeChange: PropTypes.func.isRequired,
  playState: PropTypes.oneOf(Object.values(MEDIA_PLAY_STATE)).isRequired,
  playedMilliseconds: PropTypes.number.isRequired,
  sourceUrl: PropTypes.string,
  volume: PropTypes.number.isRequired
};

MediaPlayerControls.defaultProps = {
  audioOnly: false,
  canDownload: false,
  sourceUrl: null
};

export default MediaPlayerControls;
