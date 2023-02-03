import PropTypes from 'prop-types';
import { Button, Select } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MediaVolumeSlider from './media-volume-slider.js';
import SoloIcon from '../icons/media-player/solo-icon.js';
import { replaceItemAt } from '../../utils/array-utils.js';

function TrackMixerDisplay({
  tracks,
  volumes,
  volumePresets,
  selectedVolumePresetIndex,
  onVolumesChange,
  onSelectedVolumePresetIndexChange
}) {
  const { t } = useTranslation('trackMixerDisplay');

  const [currentSoloTrackIndex, setCurrentSoloTrackIndex] = useState(-1);
  const [preSoloTrackVolumes, setPreSoloTrackVolumes] = useState([...volumes]);

  const handleTrackSoloClick = soloTrackIndex => {
    if (soloTrackIndex === currentSoloTrackIndex) {
      const newVolumes = [...preSoloTrackVolumes];
      newVolumes[soloTrackIndex] = volumes[soloTrackIndex];
      setCurrentSoloTrackIndex(-1);
      onVolumesChange(newVolumes);
    } else {
      setPreSoloTrackVolumes([...volumes]);
      const newVolumes = volumes.map(() => 0);
      newVolumes[soloTrackIndex] = volumes[soloTrackIndex];
      setCurrentSoloTrackIndex(soloTrackIndex);
      onVolumesChange(newVolumes);
    }
  };

  const handleVolumePresetOptionSelect = newIndex => {
    onSelectedVolumePresetIndexChange(newIndex);
  };

  const handleVolumeChange = (newVolume, index) => {
    onVolumesChange(replaceItemAt(volumes, newVolume, index));
  };

  return (
    <div className="TrackMixerDisplay">
      {volumePresets.length > 1 && (
        <div className="TrackMixerDisplay-volumePreset">
          <span>{`${t('common:volumePreset')}:`}</span>
          <Select
            bordered={false}
            placement="bottomRight"
            dropdownMatchSelectWidth={false}
            value={selectedVolumePresetIndex}
            options={volumePresets.map((preset, index) => ({ label: preset.name, value: index }))}
            onSelect={handleVolumePresetOptionSelect}
            className="TrackMixerDisplay-volumePresetSelector"
            />
        </div>
      )}
      <div className="TrackMixerDisplay-tracks">
        {tracks.map((track, index) => (
          <div key={index.toString()} className="TrackMixerDisplay-track">
            <div className="TrackMixerDisplay-trackVolume">
              <MediaVolumeSlider
                orientation="vertical"
                value={volumes[index]}
                onChange={newValue => handleVolumeChange(newValue, index)}
                />
              {tracks.length > 1 && (
              <div className="TrackMixerDisplay-trackSolo">
                <Button
                  type="link"
                  icon={<SoloIcon />}
                  disabled={currentSoloTrackIndex > -1 && currentSoloTrackIndex !== index}
                  onClick={() => handleTrackSoloClick(index)}
                  />
              </div>
              )}
            </div>
            <div className="TrackMixerDisplay-trackName">
              {track.name || t('trackNumberLabel', { trackNumber: index + 1 })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

TrackMixerDisplay.propTypes = {
  tracks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string
  })).isRequired,
  volumes: PropTypes.arrayOf(PropTypes.number).isRequired,
  volumePresets: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired
  })).isRequired,
  selectedVolumePresetIndex: PropTypes.number.isRequired,
  onVolumesChange: PropTypes.func.isRequired,
  onSelectedVolumePresetIndexChange: PropTypes.func.isRequired
};

export default TrackMixerDisplay;
