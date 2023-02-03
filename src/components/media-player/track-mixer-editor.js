import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select, Tooltip } from 'antd';
import cloneDeep from '../../utils/clone-deep.js';
import { SettingOutlined } from '@ant-design/icons';
import { useMediaDurations } from './media-hooks.js';
import MediaVolumeSlider from './media-volume-slider.js';
import DimensionsProvider from '../dimensions-provider.js';
import VolumePresetsModal from './volume-presets-modal.js';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';

const ALLOWED_TRACK_BAR_OVERFLOW_IN_PX = 10;

function TrackMixerEditor({
  mainTrack,
  secondaryTracks,
  volumePresets,
  onVolumePresetsChange,
  selectedVolumePresetIndex,
  onSelectedVolumePresetIndexChange
}) {
  const { t } = useTranslation('trackMixerEditor');
  const [mainTrackDuration] = useMediaDurations([mainTrack.sourceUrl]);
  const [isVolumePresetsModalOpen, setIsVolumePresetsModalOpen] = useState(false);
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
    setIsVolumePresetsModalOpen(true);
  };

  const handleVolumePresetsModalOk = (hasMadeChanges, updatedVolumePresets) => {
    if (hasMadeChanges) {
      onSelectedVolumePresetIndexChange(0);
      onVolumePresetsChange(updatedVolumePresets);
    }
    setIsVolumePresetsModalOpen(false);
  };

  const handleVolumePresetsModalClose = () => {
    setIsVolumePresetsModalOpen(false);
  };

  const handleMainTrackVolumeChange = newVolume => {
    const newPresets = cloneDeep(volumePresets);
    newPresets[selectedVolumePresetIndex].mainTrack = newVolume;
    onVolumePresetsChange(newPresets);
  };

  const handleSecondaryTrackVolumeChange = (newVolume, index) => {
    const newPresets = cloneDeep(volumePresets);
    newPresets[selectedVolumePresetIndex].secondaryTracks[index] = newVolume;
    onVolumePresetsChange(newPresets);
  };

  const tracks = [
    {
      name: mainTrack.name,
      volume: volumePresets[selectedVolumePresetIndex].mainTrack,
      secondaryTrackIndex: -1,
      trackDurationInMs: mainTrackDurationInMs,
      getBarWidth: containerWidth => calculateBarWidth(containerWidth, mainTrackDurationInMs),
      handleVolumeChange: volume => handleMainTrackVolumeChange(volume)
    },
    ...secondaryTracks.map((secondaryTrack, index) => ({
      name: secondaryTrack.name,
      volume: volumePresets[selectedVolumePresetIndex].secondaryTracks[index],
      secondaryTrackIndex: index,
      trackDurationInMs: secondaryTrackDurations[index].duration,
      getBarWidth: containerWidth => calculateBarWidth(containerWidth, secondaryTrackDurations[index].duration),
      handleVolumeChange: volume => handleSecondaryTrackVolumeChange(volume, index)
    }))
  ];

  return (
    <div className="TrackMixerEditor">
      <div className="TrackMixerEditor-tracks">
        <div className="TrackMixerEditor-volumesColumn">
          <div className="TrackMixerEditor-volumePresets">
            <span>{`${t('common:volumePreset')}:`}</span>
            <div className="TrackMixerEditor-volumePresetsSetup">
              <Select
                value={selectedVolumePresetIndex}
                options={volumePresets.map((preset, index) => ({ label: preset.name, value: index }))}
                onSelect={onSelectedVolumePresetIndexChange}
                className="TrackMixerEditor-volumePresetSelector"
                />
              <Tooltip title={t('manageVolumePresets')}>
                <Button icon={<SettingOutlined />} type="primary" onClick={handleVolumePresetsSettingsClick} />
              </Tooltip>
            </div>
          </div>

          {tracks.map(trackInfo => (
            <div className="TrackMixerEditor-trackNameAndVolume" key={trackInfo.secondaryTrackIndex}>
              <div className="TrackMixerEditor-trackName">{trackInfo.name}</div>
              <MediaVolumeSlider value={trackInfo.volume} onChange={trackInfo.handleVolumeChange} />
            </div>
          ))}
        </div>
        <div className="TrackMixerEditor-barsColumn">
          <div className="TrackMixerEditor-barsColumnLabel">{t('trackDurations')}</div>
          <DimensionsProvider>
            {({ containerWidth }) => tracks.map(trackInfo => (
              <div className="TrackMixerEditor-barRow" key={trackInfo.secondaryTrackIndex}>
                {!!trackInfo.trackDurationInMs && (
                <div
                  className={classNames({
                    'TrackMixerEditor-bar': true,
                    'TrackMixerEditor-bar--secondaryTrack': trackInfo.secondaryTrackIndex !== -1
                  })}
                  style={{ width: `${trackInfo.getBarWidth(containerWidth)}px` }}
                  >
                  {formatMillisecondsAsDuration(trackInfo.trackDurationInMs, { millisecondsLength: 1 })}
                </div>
                )}
                {!trackInfo.trackDurationInMs && (
                <span className="TrackMixerEditor-barPlaceholderText">{t('noTrack')}</span>
                )}
                <div className="TrackMixerEditor-barOverflow" />
              </div>
            ))}
          </DimensionsProvider>
        </div>
      </div>

      <VolumePresetsModal
        volumePresets={volumePresets}
        onOk={handleVolumePresetsModalOk}
        onClose={handleVolumePresetsModalClose}
        isOpen={isVolumePresetsModalOpen}
        />
    </div>
  );
}

TrackMixerEditor.propTypes = {
  mainTrack: PropTypes.shape({
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    playbackRange: PropTypes.arrayOf(PropTypes.number).isRequired
  }).isRequired,
  secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    sourceUrl: PropTypes.string
  })).isRequired,
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    mainTrack: PropTypes.number,
    secondaryTracks: PropTypes.arrayOf(PropTypes.number)
  })).isRequired,
  onVolumePresetsChange: PropTypes.func.isRequired,
  selectedVolumePresetIndex: PropTypes.number.isRequired,
  onSelectedVolumePresetIndexChange: PropTypes.func.isRequired
};

export default TrackMixerEditor;
