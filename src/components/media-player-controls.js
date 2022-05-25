import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import { useNumberFormat } from './locale-context.js';
import { Menu, Button, Slider, Dropdown } from 'antd';
import HttpClient from '../api-clients/http-client.js';
import { FastForwardOutlined } from '@ant-design/icons';
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
  const { formatNumber } = useNumberFormat();

  const httpClient = useService(HttpClient);
  const { t } = useTranslation('mediaPlayerControls');

  const showAsPlaying = playState === MEDIA_PLAY_STATE.playing || playState === MEDIA_PLAY_STATE.buffering;

  const handleDownloadClick = () => httpClient.download(sourceUrl);
  const handlePlaybackSpeedClick = item => { console.log(item); };

  const menuItems = [];

  if (canDownload && sourceUrl) {
    const downloadItem = (
      <Menu.Item
        key="download"
        onClick={handleDownloadClick}
        icon={<div className="MediaPlayerControls-downloadItem"><DownloadIcon /></div>}
        >
        {t('download')}
      </Menu.Item>
    );
    menuItems.push(downloadItem);
  }

  const playbackSpeed = (
    <Menu.SubMenu key="playbackSpeed" icon={<FastForwardOutlined />} title={t('playbackSpeed')} onClick={handlePlaybackSpeedClick}>
      <Menu.Item key="0.25">{formatNumber(0.25)}</Menu.Item>
      <Menu.Item key="0.50">{formatNumber(0.5)}</Menu.Item>
      <Menu.Item key="0.75">{formatNumber(0.75)}</Menu.Item>
      <Menu.Item key="1">{t('normal')}</Menu.Item>
      <Menu.Item key="1.25">{formatNumber(1.25)}</Menu.Item>
      <Menu.Item key="1.5">{formatNumber(1.5)}</Menu.Item>
      <Menu.Item key="1.75">{formatNumber(1.75)}</Menu.Item>
      <Menu.Item key="2">{formatNumber(2)}</Menu.Item>
    </Menu.SubMenu>
  );
  menuItems.push(playbackSpeed);

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
        {!!menuItems.length && (
          <Dropdown overlay={<Menu>{menuItems}</Menu>} placement="bottomRight" trigger={['click']}>
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
