import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { Fragment, useState } from 'react';
import { useNumberFormat } from '../locale-context.js';
import MediaVolumeSlider from './media-volume-slider.js';
import PlayIcon from '../icons/media-player/play-icon.js';
import PauseIcon from '../icons/media-player/pause-icon.js';
import DownloadIcon from '../icons/general/download-icon.js';
import { MEDIA_SCREEN_MODE } from '../../domain/constants.js';
import SettingsIcon from '../icons/main-menu/settings-icon.js';
import { CheckOutlined, FastForwardOutlined } from '@ant-design/icons';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';

const NORMAL_PLAYBACK_RATE = 1;
const PLAYBACK_RATES = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function MediaPlayerControls({
  durationInMilliseconds,
  isPlaying,
  millisecondsLength,
  playedMilliseconds,
  screenMode,
  volume,
  onDownloadClick,
  onPauseClick,
  onPlaybackRateChange,
  onPlayClick,
  onVolumeChange
}) {
  const formatNumber = useNumberFormat();
  const { t } = useTranslation('mediaPlayerControls');
  const [playbackRate, setPlaybackRate] = useState(NORMAL_PLAYBACK_RATE);

  const handleSettingsMenuItemClick = ({ key }) => {
    if (key === 'download') {
      onDownloadClick();
    } else if (key.startsWith('playbackRate-')) {
      const newPlaybackRate = Number(key.split('-')[1]);
      setPlaybackRate(newPlaybackRate);
      onPlaybackRateChange(newPlaybackRate);
    }
  };

  const getSettingsMenuItems = () => {
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

    return items;
  };
  const formattedPlayedTime = formatMillisecondsAsDuration(playedMilliseconds, { millisecondsLength });
  const formattedDuration = formatMillisecondsAsDuration(durationInMilliseconds, { millisecondsLength });

  const renderTimeDisplay = () => {
    return durationInMilliseconds
      ? <Fragment>{formattedPlayedTime}&nbsp;/&nbsp;{formattedDuration}</Fragment>
      : <Fragment>--:--&nbsp;/&nbsp;--:--</Fragment>;
  };

  return (
    <div className={classNames('MediaPlayerControls', { 'MediaPlayerControls--noScreen': screenMode === MEDIA_SCREEN_MODE.none })}>
      <div className="MediaPlayerControls-controlsGroup">
        {!!isPlaying && <Button type="link" icon={<PauseIcon />} onClick={onPauseClick} />}
        {!isPlaying && <Button type="link" icon={<PlayIcon />} onClick={onPlayClick} />}
        <div className="MediaPlayerControls-volumeControls">
          <MediaVolumeSlider value={volume} onChange={onVolumeChange} />
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
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{ items: getSettingsMenuItems(), onClick: handleSettingsMenuItemClick }}
            >
            <Button type="link" icon={<SettingsIcon />} />
          </Dropdown>
        </div>
      </div>
    </div>
  );
}

MediaPlayerControls.propTypes = {
  durationInMilliseconds: PropTypes.number.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  millisecondsLength: PropTypes.number,
  playedMilliseconds: PropTypes.number.isRequired,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  volume: PropTypes.number.isRequired,
  onDownloadClick: PropTypes.func,
  onPauseClick: PropTypes.func.isRequired,
  onPlayClick: PropTypes.func.isRequired,
  onPlaybackRateChange: PropTypes.func,
  onVolumeChange: PropTypes.func.isRequired
};

MediaPlayerControls.defaultProps = {
  millisecondsLength: 0,
  screenMode: MEDIA_SCREEN_MODE.video,
  onDownloadClick: null,
  onPlaybackRateChange: () => {}
};

export default MediaPlayerControls;
