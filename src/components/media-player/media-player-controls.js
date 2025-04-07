import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Button, Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import { useIsIOS } from '../request-context.js';
import { CheckOutlined } from '@ant-design/icons';
import MediaInfoDialog from './media-info-dialog.js';
import { useNumberFormat } from '../locale-context.js';
import MediaVolumeSlider from './media-volume-slider.js';
import React, { Fragment, useId, useState } from 'react';
import PlayIcon from '../icons/media-player/play-icon.js';
import PauseIcon from '../icons/media-player/pause-icon.js';
import { mediaLibraryItemShape } from '../../ui/default-prop-types.js';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';
import { MEDIA_SCREEN_MODE, DEFAULT_MEDIA_PLAYBACK_RATE, MEDIA_PLAYBACK_RATES } from '../../domain/constants.js';
import { DownloadIcon, EnterFullscreenIcon, ExitFullscreenIcon, InfoIcon, PlaybackRateIcon, RepeatIcon, RepeatOffIcon, SpinIcon } from '../icons/icons.js';

export const MEDIA_PLAYER_CONTROLS_STATE = {
  paused: 'paused',
  playing: 'playing',
  loading: 'loading',
  waiting: 'waiting',
  disabled: 'disabled'
};

function MediaPlayerControls({
  allowDownload,
  allowFullscreen,
  allowLoop,
  allowPlaybackRate,
  allowMediaInfo,
  durationInMilliseconds,
  millisecondsLength,
  playedMilliseconds,
  screenMode,
  state,
  volume,
  loopMedia,
  isFullscreen,
  playbackRate,
  mediaInfo,
  onDownloadClick,
  onPauseClick,
  onPlaybackRateChange,
  onLoopMediaChange,
  onFullscreenChange,
  onPlayClick,
  onVolumeChange
}) {
  const isIOS = useIsIOS();
  const componentInstanceId = useId();
  const formatNumber = useNumberFormat();
  const { t } = useTranslation('mediaPlayerControls');
  const [isMediaInfoDialogOpen, setIsMediaInfoDialogOpen] = useState(false);

  const handlePlaybackRateMenuItemClick = ({ key }) => {
    onPlaybackRateChange(Number(key));
  };

  const handleLoopToggleButtonClick = () => {
    onLoopMediaChange(!loopMedia);
  };

  const handleFullscreenButtonClick = () => {
    onFullscreenChange(!isFullscreen);
  };

  const handleMediaInfoButtonClick = () => {
    setIsMediaInfoDialogOpen(true);
  };

  const handleMediaInfoDialogClose = () => {
    setIsMediaInfoDialogOpen(false);
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

  const mainClasses = classNames(
    'MediaPlayerControls',
    { 'MediaPlayerControls--noScreen': screenMode === MEDIA_SCREEN_MODE.none }
  );

  return (
    <div id={componentInstanceId} className={mainClasses}>
      <div className="MediaPlayerControls-controlsGroup">
        {primaryButton}
        {!isIOS && (
          <div className="MediaPlayerControls-volumeControls">
            <MediaVolumeSlider value={volume} disabled={disableSecondaryControls} onChange={onVolumeChange} />
          </div>
        )}
        <div className="MediaPlayerControls-timeDisplay">
          {renderTimeDisplay()}
        </div>
      </div>
      <div className="MediaPlayerControls-controlsGroup">
        <div>
          {!!allowPlaybackRate && (
            <Dropdown
              placement="top"
              trigger={['click']}
              getPopupContainer={() => document.getElementById(componentInstanceId)}
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
          )}
          {!!allowLoop && (
            <Button
              type="link"
              disabled={disableSecondaryControls}
              icon={loopMedia ? <RepeatIcon /> : <RepeatOffIcon />}
              onClick={handleLoopToggleButtonClick}
              />
          )}
          {!!allowMediaInfo && (
            <Button
              type="link"
              icon={<InfoIcon />}
              disabled={disableSecondaryControls}
              onClick={handleMediaInfoButtonClick}
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
          {!!allowFullscreen && !isFullscreen && (
            <Button type="link" icon={<EnterFullscreenIcon />} onClick={handleFullscreenButtonClick} />
          )}
          {!!allowFullscreen && !!isFullscreen && (
            <Button type="link" icon={<ExitFullscreenIcon />} onClick={handleFullscreenButtonClick} />
          )}
        </div>
      </div>
      <MediaInfoDialog
        mediaInfo={mediaInfo}
        isOpen={isMediaInfoDialogOpen}
        onClose={handleMediaInfoDialogClose}
        />
    </div>
  );
}

MediaPlayerControls.propTypes = {
  allowDownload: PropTypes.bool,
  allowFullscreen: PropTypes.bool,
  allowLoop: PropTypes.bool,
  allowPlaybackRate: PropTypes.bool,
  allowMediaInfo: PropTypes.bool,
  durationInMilliseconds: PropTypes.number,
  isFullscreen: PropTypes.bool,
  millisecondsLength: PropTypes.number,
  playedMilliseconds: PropTypes.number,
  screenMode: PropTypes.oneOf(Object.values(MEDIA_SCREEN_MODE)),
  state: PropTypes.oneOf(Object.values(MEDIA_PLAYER_CONTROLS_STATE)),
  volume: PropTypes.number,
  loopMedia: PropTypes.bool,
  playbackRate: PropTypes.oneOf(MEDIA_PLAYBACK_RATES),
  mediaInfo: mediaLibraryItemShape,
  onDownloadClick: PropTypes.func,
  onFullscreenChange: PropTypes.func,
  onPauseClick: PropTypes.func,
  onPlayClick: PropTypes.func,
  onPlaybackRateChange: PropTypes.func,
  onLoopMediaChange: PropTypes.func,
  onVolumeChange: PropTypes.func
};

MediaPlayerControls.defaultProps = {
  allowDownload: false,
  allowFullscreen: false,
  allowLoop: false,
  allowPlaybackRate: false,
  allowMediaInfo: false,
  durationInMilliseconds: 0,
  isFullscreen: false,
  millisecondsLength: 0,
  playedMilliseconds: 0,
  screenMode: MEDIA_SCREEN_MODE.none,
  state: MEDIA_PLAYER_CONTROLS_STATE.paused,
  volume: 1,
  loopMedia: false,
  playbackRate: DEFAULT_MEDIA_PLAYBACK_RATE,
  mediaInfo: null,
  onPauseClick: () => {},
  onPlayClick: () => {},
  onPlaybackRateChange: () => {},
  onDownloadClick: () => {},
  onFullscreenChange: () => {},
  onLoopMediaChange: () => {},
  onVolumeChange: () => {}
};

export default MediaPlayerControls;
