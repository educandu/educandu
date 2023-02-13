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

  const [currentSoloTrackKey, setCurrentSoloTrackKey] = useState(null);
  const [preSoloTrackVolumes, setPreSoloTrackVolumes] = useState([...volumes]);

  const handleTrackSoloClick = (soloTrackKey, soloTrackIndex) => {
    if (soloTrackKey === currentSoloTrackKey) {
      const newVolumes = preSoloTrackVolumes.length ? [...preSoloTrackVolumes] : [...volumes];
      newVolumes[soloTrackIndex] = volumes[soloTrackIndex];
      setCurrentSoloTrackKey(null);
      onVolumesChange(newVolumes);
    } else {
      setPreSoloTrackVolumes([...volumes]);
      const newVolumes = volumes.map(() => 0);
      newVolumes[soloTrackIndex] = volumes[soloTrackIndex];
      setCurrentSoloTrackKey(soloTrackKey);
      onVolumesChange(newVolumes);
    }
  };

  const handleVolumePresetOptionSelect = newIndex => {
    setCurrentSoloTrackKey(null);
    setPreSoloTrackVolumes([]);
    onSelectedVolumePresetIndexChange(newIndex);
  };

  const handleVolumeChange = (newVolume, trackKey, trackIndex) => {
    if (!!currentSoloTrackKey && trackKey !== currentSoloTrackKey) {
      setCurrentSoloTrackKey(null);
      setPreSoloTrackVolumes([]);
    }
    onVolumesChange(replaceItemAt(volumes, newVolume, trackIndex));
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
        {tracks.map((track, trackIndex) => (
          <div key={track.key} className="TrackMixerDisplay-track">
            <div className="TrackMixerDisplay-trackVolume">
              <MediaVolumeSlider
                orientation="vertical"
                value={volumes[trackIndex]}
                onChange={newValue => handleVolumeChange(newValue, track.key, trackIndex)}
                />
              {tracks.length > 1 && (
                <div className="TrackMixerDisplay-trackSolo">
                  <Button
                    type="link"
                    icon={<SoloIcon />}
                    disabled={!!currentSoloTrackKey && currentSoloTrackKey !== track.key}
                    onClick={() => handleTrackSoloClick(track.key, trackIndex)}
                    />
                </div>
              )}
            </div>
            <div className="TrackMixerDisplay-trackName">
              {track.name || t('trackNumberLabel', { trackNumber: trackIndex + 1 })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

TrackMixerDisplay.propTypes = {
  tracks: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
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
