import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select, Tooltip } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useMediaDurations } from './media-hooks.js';
import MediaVolumeSlider from './media-volume-slider.js';
import DimensionsProvider from '../dimensions-provider.js';
import VolumePresetsModal from './volume-presets-modal.js';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';

const ALLOWED_TRACK_BAR_OVERFLOW_IN_PX = 10;

function TrackMixer({
  mainTrack,
  secondaryTracks,
  volumePresets,
  selectedVolumePreset,
  onMainTrackVolumeChange,
  onSecondaryTrackVolumeChange,
  onSelectedVolumePresetChange,
  onVolumePresetsChange
}) {
  const { t } = useTranslation('trackMixer');
  const [mainTrackDuration] = useMediaDurations([mainTrack.sourceUrl]);
  const [isVolumePresetsModalVisible, setIsVolumePresetsModalVisible] = useState(false);
  const secondaryTrackDurations = useMediaDurations(secondaryTracks.map(track => track.sourceUrl));

  const mainTrackDurationInMs = (mainTrack.playbackRange[1] - mainTrack.playbackRange[0]) * mainTrackDuration.duration;

  const calculateBarWidth = (containerWidth, trackDuration) => {
    if (!containerWidth || !trackDuration || !mainTrackDurationInMs) {
      return 0;
    }

    const msToPxRatio = containerWidth / mainTrackDurationInMs;
    const maxBarWidth = containerWidth + ALLOWED_TRACK_BAR_OVERFLOW_IN_PX;
    return Math.min(maxBarWidth, trackDuration * msToPxRatio);
  };

  const handleVolumePresetsSettingsClick = () => {
    setIsVolumePresetsModalVisible(true);
  };

  const handleVolumePresetsModalOk = updatedVolumePresets => {
    onVolumePresetsChange(updatedVolumePresets);
    setIsVolumePresetsModalVisible(false);
  };

  const handleVolumePresetsModalClose = () => {
    setIsVolumePresetsModalVisible(false);
  };

  const tracks = [
    {
      name: mainTrack.name,
      volume: mainTrack.volume,
      secondaryTrackIndex: -1,
      trackDurationInMs: mainTrackDurationInMs,
      getBarWidth: containerWidth => calculateBarWidth(containerWidth, mainTrackDurationInMs),
      handleVolumeChange: volume => onMainTrackVolumeChange(volume)
    },
    ...secondaryTracks.map((secondaryTrack, index) => ({
      name: secondaryTrack.name,
      volume: secondaryTrack.volume,
      secondaryTrackIndex: index,
      trackDurationInMs: secondaryTrackDurations[index].duration,
      getBarWidth: containerWidth => calculateBarWidth(containerWidth, secondaryTrackDurations[index].duration),
      handleVolumeChange: volume => onSecondaryTrackVolumeChange(volume, index)
    }))
  ];

  return (
    <div className="TrackMixer">
      <div className="TrackMixer-tracks">
        <div className="TrackMixer-volumesColumn">
          <div className="TrackMixer-volumePresets">
            <span>{`${t('common:volumesPreset')}:`}</span>
            <div className="TrackMixer-volumePresetsSetup">
              <Select
                value={selectedVolumePreset}
                options={volumePresets.map((preset, index) => ({ label: preset.name, value: index }))}
                onSelect={onSelectedVolumePresetChange}
                className="TrackMixer-volumePresetSelector"
                />
              <Tooltip title={t('manageVolumePresets')}>
                <Button icon={<SettingOutlined />} onClick={handleVolumePresetsSettingsClick} />
              </Tooltip>
            </div>
          </div>

          {tracks.map(trackInfo => (
            <div className="TrackMixer-trackNameAndVolume" key={trackInfo.secondaryTrackIndex}>
              <div className="TrackMixer-trackName">{trackInfo.name}</div>
              <MediaVolumeSlider value={trackInfo.volume} onChange={trackInfo.handleVolumeChange} />
            </div>
          ))}
        </div>
        <div className="TrackMixer-barsColumn">
          <DimensionsProvider>
            {({ containerWidth }) => tracks.map(trackInfo => (
              <div className="TrackMixer-barRow" key={trackInfo.secondaryTrackIndex}>
                {!!trackInfo.trackDurationInMs && (
                <div
                  className={classNames({
                    'TrackMixer-bar': true,
                    'TrackMixer-bar--secondaryTrack': trackInfo.secondaryTrackIndex !== -1
                  })}
                  style={{ width: `${trackInfo.getBarWidth(containerWidth)}px` }}
                  >
                  {formatMillisecondsAsDuration(trackInfo.trackDurationInMs, { millisecondsLength: 1 })}
                </div>
                )}
                {!trackInfo.trackDurationInMs && (
                <span className="TrackMixer-barPlaceholderText">{t('noTrack')}</span>
                )}
                <div className="TrackMixer-barOverflow" />
              </div>
            ))}
          </DimensionsProvider>
        </div>
      </div>

      <VolumePresetsModal
        volumePresets={volumePresets}
        onOk={handleVolumePresetsModalOk}
        onClose={handleVolumePresetsModalClose}
        isVisible={isVolumePresetsModalVisible}
        />
    </div>
  );
}

TrackMixer.propTypes = {
  mainTrack: PropTypes.shape({
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    volume: PropTypes.number.isRequired,
    playbackRange: PropTypes.arrayOf(PropTypes.number).isRequired
  }).isRequired,
  onMainTrackVolumeChange: PropTypes.func.isRequired,
  onSecondaryTrackVolumeChange: PropTypes.func.isRequired,
  onSelectedVolumePresetChange: PropTypes.func.isRequired,
  onVolumePresetsChange: PropTypes.func.isRequired,
  secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    volume: PropTypes.number.isRequired
  })).isRequired,
  selectedVolumePreset: PropTypes.number.isRequired,
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    mainTrack: PropTypes.number,
    secondaryTracks: PropTypes.arrayOf(PropTypes.number)
  })).isRequired
};

export default TrackMixer;
