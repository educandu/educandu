import Info from '../info.js';
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
  tracks,
  volumePresets,
  onVolumePresetsChange,
  selectedVolumePresetIndex,
  onSelectedVolumePresetIndexChange
}) {
  const { t } = useTranslation('trackMixerEditor');
  const [isVolumePresetsModalOpen, setIsVolumePresetsModalOpen] = useState(false);
  const trackDurations = useMediaDurations(tracks.map(track => track.sourceUrl));

  const mainTrackPlaybackDurationInMs = (tracks[0].playbackRange[1] - tracks[0].playbackRange[0]) * trackDurations[0].duration;

  const calculateBarWidth = (containerWidth, trackIndex) => {
    const trackDuration = trackDurations[trackIndex].duration;

    if (!containerWidth || !trackDuration) {
      return 0;
    }

    const msToPxRatio = containerWidth / mainTrackPlaybackDurationInMs;
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

  const handleTrackVolumeChange = (newVolume, index) => {
    const newPresets = cloneDeep(volumePresets);
    newPresets[selectedVolumePresetIndex].tracks[index] = newVolume;
    onVolumePresetsChange(newPresets);
  };

  const trackInfos = tracks.map((track, index) => ({
    key: track.key,
    name: track.name,
    volume: volumePresets[selectedVolumePresetIndex].tracks[index],
    isMainTrack: index === 0,
    trackDurationInMs: index === 0 ? mainTrackPlaybackDurationInMs : trackDurations[index].duration,
    getBarWidth: containerWidth => calculateBarWidth(containerWidth, index),
    handleVolumeChange: volume => handleTrackVolumeChange(volume, index)
  }));

  return (
    <div className="TrackMixerEditor">
      <div className="TrackMixerEditor-tracks">
        <div className="TrackMixerEditor-volumesColumn">
          <div className="TrackMixerEditor-volumePresets">
            <div className="TrackMixerEditor-volumePresetsLabel">
              <Info tooltip={t('volumePresetInfo')}>{t('common:volumePreset')}:</Info>
            </div>
            <div className="TrackMixerEditor-volumePresetsSetup">
              <Select
                value={selectedVolumePresetIndex}
                options={volumePresets.map((preset, index) => ({ label: preset.name, value: index }))}
                onSelect={onSelectedVolumePresetIndexChange}
                className="TrackMixerEditor-volumePresetSelector"
                />
              <Tooltip title={t('common:edit')}>
                <Button icon={<SettingOutlined />} type="primary" onClick={handleVolumePresetsSettingsClick} />
              </Tooltip>
            </div>
          </div>

          {trackInfos.map(trackInfo => (
            <div className="TrackMixerEditor-trackNameAndVolume" key={trackInfo.key}>
              <div className="TrackMixerEditor-trackName">{trackInfo.name}</div>
              <div className="TrackMixerEditor-trackVolume">
                <MediaVolumeSlider value={trackInfo.volume} onChange={trackInfo.handleVolumeChange} useValueLabel />
              </div>
            </div>
          ))}
        </div>
        <div className="TrackMixerEditor-barsColumn">
          <div className="TrackMixerEditor-barsColumnLabel">{t('trackDurations')}</div>
          <DimensionsProvider>
            {({ containerWidth }) => trackInfos.map(trackInfo => (
              <div className="TrackMixerEditor-barRow" key={trackInfo.key}>
                {!!trackInfo.trackDurationInMs && (
                <div
                  className={classNames({
                    'TrackMixerEditor-bar': true,
                    'TrackMixerEditor-bar--secondaryTrack': !trackInfo.isMainTrack
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
  tracks: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    playbackRange: PropTypes.arrayOf(PropTypes.number).isRequired
  })).isRequired,
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    tracks: PropTypes.arrayOf(PropTypes.number)
  })).isRequired,
  onVolumePresetsChange: PropTypes.func.isRequired,
  selectedVolumePresetIndex: PropTypes.number.isRequired,
  onSelectedVolumePresetIndexChange: PropTypes.func.isRequired
};

export default TrackMixerEditor;
