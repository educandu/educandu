import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useState } from 'react';
import { useNumberFormat } from './locale-context.js';
import { Menu, Button, Slider, Dropdown } from 'antd';
import MuteIcon from './icons/media-player/mute-icon.js';
import PlayIcon from './icons/media-player/play-icon.js';
import PauseIcon from './icons/media-player/pause-icon.js';
import DownloadIcon from './icons/general/download-icon.js';
import VolumeIcon from './icons/media-player/volume-icon.js';
import SettingsIcon from './icons/main-menu/settings-icon.js';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';
import { CheckOutlined, FastForwardOutlined } from '@ant-design/icons';
import { MEDIA_PLAY_STATE, MEDIA_SCREEN_MODE } from '../domain/constants.js';

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
  screenMode,
  onDownloadClick
}) {
  const { formatNumber } = useNumberFormat();
  const { t } = useTranslation('mediaPlayerControls');

  const [playbackRate, setPlaybackRate] = useState(NORMAL_PLAYBACK_RATE);

  const showAsPlaying = playState === MEDIA_PLAY_STATE.playing || playState === MEDIA_PLAY_STATE.buffering;

  const handleSettingsMenuItemClick = ({ key }) => {
    if (key === 'download') {
      onDownloadClick();
    } else if (key.startsWith('playbackRate-')) {
      const newPlaybackRate = Number(key.split('-')[1]);
      setPlaybackRate(newPlaybackRate);
      onPlaybackRateChange(newPlaybackRate);
    }
  };

  const renderSettingsMenu = () => {
    const items = [];

    if (onDownloadClick) {
      items.push({
        key: 'download',
        label: t('download'),
        icon: <DownloadIcon className="u-dropdown-icon" />
      });
    }

    items.push({
      key: 'playbackRate',
      label: t('playbackRate'),
      icon: <FastForwardOutlined />,
      children: PLAYBACK_RATES.map(rate => ({
        key: `playbackRate-${rate}`,
        label: (
          <div className="MediaPlayerControls-playbackRateItem">
            <div className="MediaPlayerControls-playbackRateItemSelection">
              {rate === playbackRate && <CheckOutlined />}
            </div>
            {rate === NORMAL_PLAYBACK_RATE ? t('normal') : formatNumber(rate)}
          </div>
        )
      }))
    });

    return <Menu items={items} onClick={handleSettingsMenuItemClick} />;
  };

  const renderTimeDisplay = () => {
    return durationInMilliseconds
      ? <Fragment>{formatMillisecondsAsDuration(playedMilliseconds)}&nbsp;/&nbsp;{formatMillisecondsAsDuration(durationInMilliseconds)}</Fragment>
      : <Fragment>--:--&nbsp;/&nbsp;--:--</Fragment>;
  };

  return (
    <div className={classNames('MediaPlayerControls', { 'MediaPlayerControls--noScreen': screenMode === MEDIA_SCREEN_MODE.none })}>
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
        <div className="MediaPlayerControls-timeDisplay">
          {renderTimeDisplay()}
        </div>
      </div>
      <div className="MediaPlayerControls-controlsGroup">
        <div>
          {playbackRate !== NORMAL_PLAYBACK_RATE && (
            <span className="MediaPlayerControls-playbackRate">x {formatNumber(playbackRate)}</span>
          )}
          <Dropdown overlay={renderSettingsMenu()} placement="bottomRight" trigger={['click']}>
            <Button type="link" icon={<SettingsIcon />} />
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

MediaPlayerControls.propTypes = {
  durationInMilliseconds: PropTypes.number.isRequired,
  isMuted: PropTypes.bool.isRequired,
  onDownloadClick: PropTypes.func,
  onPlaybackRateChange: PropTypes.func,
  onToggleMute: PropTypes.func.isRequired,
  onTogglePlay: PropTypes.func.isRequired,
  onVolumeChange: PropTypes.func.isRequired,
  playState: PropTypes.oneOf(Object.values(MEDIA_PLAY_STATE)).isRequired,
  playedMilliseconds: PropTypes.number.isRequired,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  volume: PropTypes.number.isRequired
};

MediaPlayerControls.defaultProps = {
  onDownloadClick: null,
  onPlaybackRateChange: () => {},
  screenMode: MEDIA_SCREEN_MODE.video
};

export default MediaPlayerControls;
