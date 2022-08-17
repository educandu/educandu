import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import MediaVolumeSlider from './media-volume-slider.js';

function MediaPlayerTrackMixer({ mainTrack, secondaryTracks, onMainTrackVolumeChange, onSecondaryTrackVolumeChange }) {
  const { t } = useTranslation('mediaPlayerTrackMixer');

  return (
    <div className="MediaPlayerTrackMixer">
      <div key="main-track" className="MediaPlayerTrackMixer-track">
        <div className="MediaPlayerTrackMixer-trackVolume">
          <MediaVolumeSlider
            orientation="vertical"
            value={mainTrack.volume}
            onChange={newValue => onMainTrackVolumeChange(newValue)}
            />
        </div>
        <div className="MediaPlayerTrackMixer-trackName">
          {mainTrack.name || t('trackNumberLabel', { trackNumber: 1 })}
        </div>
      </div>
      {secondaryTracks.map((track, index) => (
        <div key={index.toString()} className="MediaPlayerTrackMixer-track">
          <div className="MediaPlayerTrackMixer-trackVolume">
            <MediaVolumeSlider
              orientation="vertical"
              value={track.volume}
              onChange={newValue => onSecondaryTrackVolumeChange(newValue, index)}
              />
          </div>
          <div className="MediaPlayerTrackMixer-trackName">
            {track.name || t('trackNumberLabel', { trackNumber: index + 2 })}
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
  secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    volume: PropTypes.number.isRequired
  }))
};

MediaPlayerTrackMixer.defaultProps = {
  onMainTrackVolumeChange: () => {},
  onSecondaryTrackVolumeChange: () => {},
  secondaryTracks: []
};

export default MediaPlayerTrackMixer;
