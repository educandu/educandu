import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useService } from './container-context.js';
import { useNumberFormat } from './locale-context.js';
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
import { CheckOutlined, FastForwardOutlined } from '@ant-design/icons';

const NORMAL_PLAYBACK_RATE = 1;
const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function MediaPlayerControls({
  durationInMilliseconds,
  playedMilliseconds,
  playState,
  volume,
  isMuted,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onPlaybackRateChange,
  audioOnly,
  sourceUrl,
  canDownload,
  canChangePlaybackRate
}) {
  const httpClient = useService(HttpClient);
  const { formatNumber } = useNumberFormat();
  const { t } = useTranslation('mediaPlayerControls');

  const [playbackRate, setPlaybackRate] = useState(NORMAL_PLAYBACK_RATE);

  const showAsPlaying = playState === MEDIA_PLAY_STATE.playing || playState === MEDIA_PLAY_STATE.buffering;

  const handleDownloadClick = () => httpClient.download(sourceUrl);
  const handlePlaybackRateClick = item => {
    const newPlaybackRate = Number(item.key);
    setPlaybackRate(newPlaybackRate);
    onPlaybackRateChange(newPlaybackRate);
  };

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

  if (canChangePlaybackRate) {
    const playbackRateItem = (
      <Menu.SubMenu
        key="playbackRate"
        icon={<FastForwardOutlined />}
        title={t('playbackRate')}
        onClick={handlePlaybackRateClick}
        >
        {PLAYBACK_RATES.map(rate => (
          <Menu.Item key={rate}>
            <div className="MediaPlayerControls-playbackRateItem">
              <div className="MediaPlayerControls-playbackRateItemSelection">
                {rate === playbackRate && <CheckOutlined />}
              </div>
              {rate === NORMAL_PLAYBACK_RATE ? t('normal') : formatNumber(rate)}
            </div>
          </Menu.Item>
        ))}
      </Menu.SubMenu>
    );
    menuItems.push(playbackRateItem);
  }

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
        <div>
          {playbackRate !== NORMAL_PLAYBACK_RATE && (
            <span className="MediaPlayerControls-playbackRate">x {formatNumber(playbackRate)}</span>
          )}
          {!!menuItems.length && (
            <Dropdown overlay={<Menu>{menuItems}</Menu>} placement="bottomRight" trigger={['click']}>
              <Button type="link" icon={<SettingsIcon />} />
            </Dropdown>
          )}
        </div>
      </div>
    </div>
  );
}

MediaPlayerControls.propTypes = {
  audioOnly: PropTypes.bool,
  canChangePlaybackRate: PropTypes.bool,
  canDownload: PropTypes.bool,
  durationInMilliseconds: PropTypes.number.isRequired,
  isMuted: PropTypes.bool.isRequired,
  onPlaybackRateChange: PropTypes.func,
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
  canChangePlaybackRate: false,
  canDownload: false,
  onPlaybackRateChange: () => {},
  sourceUrl: null
};

export default MediaPlayerControls;
