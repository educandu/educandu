import PropTypes from 'prop-types';
import { Button, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import MediaVolumeSlider from './media-volume-slider.js';
import SoloIcon from '../icons/media-player/solo-icon.js';

function MediaPlayerTrackMixer({
  mainTrack,
  secondaryTracks,
  volumePresetOptions,
  selectedVolumePreset,
  onMainTrackVolumeChange,
  onSecondaryTrackVolumeChange,
  onSelectedVolumePresetChange
}) {
  const { t } = useTranslation('mediaPlayerTrackMixer');

  const [tracks, setTracks] = useState([]);
  const [currentSoloTrackIndex, setCurrentSoloTrackIndex] = useState(-1);
  const [preSoloTrackVolumes, setPreSoloTrackVolumes] = useState([mainTrack.volume, ...secondaryTracks.map(track => track.volume)]);

  useEffect(() => {
    setTracks([
      {
        volume: mainTrack.volume,
        onVolumeChange: value => onMainTrackVolumeChange(value),
        displayName: mainTrack.name || t('trackNumberLabel', { trackNumber: 1 })
      },
      ...secondaryTracks.map((track, index) => ({
        volume: track.volume,
        onVolumeChange: value => onSecondaryTrackVolumeChange(value, index),
        displayName: track.name || t('trackNumberLabel', { trackNumber: index + 2 })
      }))
    ]);
  }, [mainTrack, secondaryTracks, onMainTrackVolumeChange, onSecondaryTrackVolumeChange, t]);

  const handleTrackSoloClick = (soloTrack, soloTrackIndex) => {
    setPreSoloTrackVolumes(tracks.map(track => track.volume));

    if (soloTrackIndex === currentSoloTrackIndex) {
      setCurrentSoloTrackIndex(-1);
      tracks.forEach((track, index) => {
        if (index !== soloTrackIndex) {
          track.onVolumeChange(preSoloTrackVolumes[index]);
        }
      });
    } else {
      setCurrentSoloTrackIndex(soloTrackIndex);
      tracks.forEach(track => {
        if (track !== soloTrack) {
          track.onVolumeChange(0);
        }
      });
    }
  };

  return (
    <div className="MediaPlayerTrackMixer">
      {!!volumePresetOptions.length > 1 && (
        <Select
          value={selectedVolumePreset}
          options={volumePresetOptions}
          onSelect={onSelectedVolumePresetChange}
          className="MediaPlayerTrackMixer-volumePresetSelector"
          />
      )}
      {tracks.map((track, index) => (
        <div key={index.toString()} className="MediaPlayerTrackMixer-track">
          <div className="MediaPlayerTrackMixer-trackVolume">
            <MediaVolumeSlider
              orientation="vertical"
              value={track.volume}
              onChange={newValue => track.onVolumeChange(newValue)}
              />
            {tracks.length > 1 && (
              <div className="MediaPlayerTrackMixer-trackSolo">
                <Button
                  type="link"
                  icon={<SoloIcon />}
                  disabled={currentSoloTrackIndex > -1 && currentSoloTrackIndex !== index}
                  onClick={() => handleTrackSoloClick(track, index)}
                  />
              </div>
            )}
          </div>
          <div className="MediaPlayerTrackMixer-trackName">
            {track.displayName}
          </div>
        </div>
      ))}
    </div>
  );
}

MediaPlayerTrackMixer.propTypes = {
  mainTrack: PropTypes.shape({
    name: PropTypes.string,
    volume: PropTypes.number.isRequired
  }).isRequired,
  onMainTrackVolumeChange: PropTypes.func,
  onSecondaryTrackVolumeChange: PropTypes.func,
  onSelectedVolumePresetChange: PropTypes.func,
  secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    volume: PropTypes.number.isRequired
  })),
  selectedVolumePreset: PropTypes.number,
  volumePresetOptions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.number
  }))
};

MediaPlayerTrackMixer.defaultProps = {
  onMainTrackVolumeChange: () => {},
  onSecondaryTrackVolumeChange: () => {},
  onSelectedVolumePresetChange: () => {},
  secondaryTracks: [],
  selectedVolumePreset: -1,
  volumePresetOptions: []
};

export default MediaPlayerTrackMixer;
