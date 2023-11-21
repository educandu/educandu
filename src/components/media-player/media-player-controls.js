import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Dropdown } from 'antd';
import React, { Fragment, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckOutlined } from '@ant-design/icons';
import { useNumberFormat } from '../locale-context.js';
import MediaVolumeSlider from './media-volume-slider.js';
import PlayIcon from '../icons/media-player/play-icon.js';
import PauseIcon from '../icons/media-player/pause-icon.js';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';
import { MEDIA_SCREEN_MODE, DEFAULT_MEDIA_PLAYBACK_RATE, MEDIA_PLAYBACK_RATES } from '../../domain/constants.js';
import { DownloadIcon, EnterFullscreenIcon, ExitFullscreenIcon, PlaybackRateIcon, RepeatIcon, RepeatOffIcon } from '../icons/icons.js';

function MediaPlayerControls({
  durationInMilliseconds,
  isPlaying,
  millisecondsLength,
  playedMilliseconds,
  screenMode,
  volume,
  loopMedia,
  isFullscreen,
  playbackRate,
  onDownloadClick,
  onPauseClick,
  onPlaybackRateChange,
  onLoopMediaChange,
  onFullscreenChange,
  onPlayClick,
  onVolumeChange
}) {
  const componentInstanceId = useId();
  const formatNumber = useNumberFormat();
  const { t } = useTranslation('mediaPlayerControls');

  const handlePlaybackRateMenuItemClick = ({ key }) => {
    onPlaybackRateChange(Number(key));
  };

  const handleLoopToggleButtonClick = () => {
    onLoopMediaChange(!loopMedia);
  };

  const handleFullscreenButtonClick = () => {
    onFullscreenChange(!isFullscreen);
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

  const mainClasses = classNames(
    'MediaPlayerControls',
    { 'MediaPlayerControls--noScreen': screenMode === MEDIA_SCREEN_MODE.none }
  );

  return (
    <div id={componentInstanceId} className={mainClasses}>
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
          <Dropdown
            placement="top"
            trigger={['click']}
            getPopupContainer={() => document.getElementById(componentInstanceId)}
            menu={{ items: getPlaybackRateMenuItems(), onClick: handlePlaybackRateMenuItemClick }}
            >
            <Button
              type="link"
              icon={playbackRate === DEFAULT_MEDIA_PLAYBACK_RATE ? <PlaybackRateIcon /> : null}
              >
              {playbackRate === DEFAULT_MEDIA_PLAYBACK_RATE ? null : renderMediaPlaybackRate()}
            </Button>
          </Dropdown>
          {!!onLoopMediaChange && (
            <Button
              type="link"
              icon={loopMedia ? <RepeatIcon /> : <RepeatOffIcon />}
              onClick={handleLoopToggleButtonClick}
              />
          )}
          {!!onDownloadClick && (
            <Button type="link" icon={<DownloadIcon />} onClick={onDownloadClick} />
          )}
          {!!onFullscreenChange && !isFullscreen && (
            <Button type="link" icon={<EnterFullscreenIcon />} onClick={handleFullscreenButtonClick} />
          )}
          {!!onFullscreenChange && !!isFullscreen && (
            <Button type="link" icon={<ExitFullscreenIcon />} onClick={handleFullscreenButtonClick} />
          )}
        </div>
      </div>
    </div>
  );
}

MediaPlayerControls.propTypes = {
  durationInMilliseconds: PropTypes.number.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  isFullscreen: PropTypes.bool,
  millisecondsLength: PropTypes.number,
  playedMilliseconds: PropTypes.number.isRequired,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  volume: PropTypes.number.isRequired,
  loopMedia: PropTypes.bool.isRequired,
  playbackRate: PropTypes.oneOf(MEDIA_PLAYBACK_RATES).isRequired,
  onDownloadClick: PropTypes.func,
  onFullscreenChange: PropTypes.func,
  onPauseClick: PropTypes.func.isRequired,
  onPlayClick: PropTypes.func.isRequired,
  onPlaybackRateChange: PropTypes.func.isRequired,
  onLoopMediaChange: PropTypes.func,
  onVolumeChange: PropTypes.func.isRequired
};

MediaPlayerControls.defaultProps = {
  isFullscreen: false,
  millisecondsLength: 0,
  screenMode: MEDIA_SCREEN_MODE.video,
  onDownloadClick: null,
  onFullscreenChange: null,
  onLoopMediaChange: null
};

export default MediaPlayerControls;
