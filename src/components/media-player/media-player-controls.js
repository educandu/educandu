import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { Fragment } from 'react';
import { Button, Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import { CheckOutlined } from '@ant-design/icons';
import { useNumberFormat } from '../locale-context.js';
import MediaVolumeSlider from './media-volume-slider.js';
import PlayIcon from '../icons/media-player/play-icon.js';
import PauseIcon from '../icons/media-player/pause-icon.js';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';
import { DownloadIcon, PlaybackRateIcon, RepeatIcon, RepeatOffIcon, SpinIcon } from '../icons/icons.js';
import { MEDIA_SCREEN_MODE, DEFAULT_MEDIA_PLAYBACK_RATE, MEDIA_PLAYBACK_RATES } from '../../domain/constants.js';

export const MEDIA_PLAYER_CONTROLS_STATE = {
  paused: 'paused',
  playing: 'playing',
  loading: 'loading',
  waiting: 'waiting',
  disabled: 'disabled'
};

function MediaPlayerControls({
  allowDownload,
  allowLoop,
  durationInMilliseconds,
  millisecondsLength,
  playedMilliseconds,
  screenMode,
  state,
  volume,
  loopMedia,
  playbackRate,
  onDownloadClick,
  onPauseClick,
  onPlaybackRateChange,
  onLoopMediaChange,
  onPlayClick,
  onVolumeChange
}) {
  const formatNumber = useNumberFormat();
  const { t } = useTranslation('mediaPlayerControls');

  const handlePlaybackRateMenuItemClick = ({ key }) => {
    onPlaybackRateChange(Number(key));
  };

  const handleLoopToggleButtonClick = () => {
    onLoopMediaChange(!loopMedia);
  };

  const getPlaybackRateMenuItems = () => {
    return MEDIA_PLAYBACK_RATES.map(rate => ({
      key: rate.toString(),
      label: (
        <div className="MediaPlayerControls-playbackRateItem">
          <div className="MediaPlayerControls-playbackRateItemSelection">
            {rate === playbackRate && <CheckOutlined />}
          </div>
          {rate === DEFAULT_MEDIA_PLAYBACK_RATE ? t('normal') : formatNumber(rate)}
        </div>
      )
    }));
  };

  const formattedPlayedTime = formatMillisecondsAsDuration(playedMilliseconds, { millisecondsLength });
  const formattedDuration = formatMillisecondsAsDuration(durationInMilliseconds, { millisecondsLength });

  const renderTimeDisplay = () => {
    return durationInMilliseconds
      ? <Fragment>{formattedPlayedTime}&nbsp;/&nbsp;{formattedDuration}</Fragment>
      : <Fragment>--:--&nbsp;/&nbsp;--:--</Fragment>;
  };

  const renderMediaPlaybackRate = () => {
    return <span className="MediaPlayerControls-playbackRate">x {formatNumber(playbackRate)}</span>;
  };

  let primaryButton;
  let disableSecondaryControls;
  switch (state) {
    case MEDIA_PLAYER_CONTROLS_STATE.paused:
      primaryButton = <Button type="link" icon={<PlayIcon />} onClick={onPlayClick} />;
      disableSecondaryControls = false;
      break;
    case MEDIA_PLAYER_CONTROLS_STATE.playing:
      primaryButton = <Button type="link" icon={<PauseIcon />} onClick={onPauseClick} />;
      disableSecondaryControls = false;
      break;
    case MEDIA_PLAYER_CONTROLS_STATE.loading:
      primaryButton = <Button type="link" icon={<SpinIcon className="u-spin" />} />;
      disableSecondaryControls = true;
      break;
    case MEDIA_PLAYER_CONTROLS_STATE.waiting:
      primaryButton = <Button type="link" icon={<PlayIcon />} onClick={onPlayClick} />;
      disableSecondaryControls = true;
      break;
    case MEDIA_PLAYER_CONTROLS_STATE.disabled:
      primaryButton = <Button type="link" icon={<PlayIcon />} disabled />;
      disableSecondaryControls = true;
      break;
    default:
      throw new Error(`Invalid media player control state '${state}'`);
  }

  return (
    <div className={classNames('MediaPlayerControls', { 'MediaPlayerControls--noScreen': screenMode === MEDIA_SCREEN_MODE.none })}>
      <div className="MediaPlayerControls-controlsGroup">
        {primaryButton}
        <div className="MediaPlayerControls-volumeControls">
          <MediaVolumeSlider value={volume} disabled={disableSecondaryControls} onChange={onVolumeChange} />
        </div>
        <div className="MediaPlayerControls-timeDisplay">
          {renderTimeDisplay()}
        </div>
      </div>
      <div className="MediaPlayerControls-controlsGroup">
        <div>
          <Dropdown
            placement="top"
            trigger={['click']}
            disabled={disableSecondaryControls}
            menu={{ items: getPlaybackRateMenuItems(), onClick: handlePlaybackRateMenuItemClick }}
            >
            <Button
              type="link"
              disabled={disableSecondaryControls}
              icon={playbackRate === DEFAULT_MEDIA_PLAYBACK_RATE ? <PlaybackRateIcon /> : null}
              >
              {playbackRate === DEFAULT_MEDIA_PLAYBACK_RATE ? null : renderMediaPlaybackRate()}
            </Button>
          </Dropdown>
          {!!allowLoop && (
            <Button
              type="link"
              disabled={disableSecondaryControls}
              icon={loopMedia ? <RepeatIcon /> : <RepeatOffIcon />}
              onClick={handleLoopToggleButtonClick}
              />
          )}
          {!!allowDownload && (
            <Button
              type="link"
              icon={<DownloadIcon />}
              disabled={disableSecondaryControls}
              onClick={onDownloadClick}
              />
          )}
        </div>
      </div>
    </div>
  );
}

MediaPlayerControls.propTypes = {
  allowDownload: PropTypes.bool,
  allowLoop: PropTypes.bool,
  durationInMilliseconds: PropTypes.number,
  millisecondsLength: PropTypes.number,
  playedMilliseconds: PropTypes.number,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  state: PropTypes.oneOf(Object.values(MEDIA_PLAYER_CONTROLS_STATE)),
  volume: PropTypes.number,
  loopMedia: PropTypes.bool,
  playbackRate: PropTypes.oneOf(MEDIA_PLAYBACK_RATES),
  onDownloadClick: PropTypes.func,
  onPauseClick: PropTypes.func,
  onPlayClick: PropTypes.func,
  onPlaybackRateChange: PropTypes.func,
  onLoopMediaChange: PropTypes.func,
  onVolumeChange: PropTypes.func
};

MediaPlayerControls.defaultProps = {
  allowDownload: false,
  allowLoop: false,
  durationInMilliseconds: 0,
  millisecondsLength: 0,
  playedMilliseconds: 0,
  screenMode: MEDIA_SCREEN_MODE.none,
  state: MEDIA_PLAYER_CONTROLS_STATE.paused,
  volume: 1,
  loopMedia: false,
  playbackRate: DEFAULT_MEDIA_PLAYBACK_RATE,
  onPauseClick: () => {},
  onPlayClick: () => {},
  onPlaybackRateChange: () => {},
  onDownloadClick: () => {},
  onLoopMediaChange: () => {},
  onVolumeChange: () => {}
};

export default MediaPlayerControls;
