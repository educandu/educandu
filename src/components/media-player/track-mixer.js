import React from 'react';
import { Select } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useMediaDurations } from './media-hooks.js';
import MediaVolumeSlider from './media-volume-slider.js';
import DimensionsProvider from '../dimensions-provider.js';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';

const ALLOWED_TRACK_BAR_OVERFLOW_IN_PX = 10;

function TrackMixer({
  mainTrack,
  secondaryTracks,
  volumePresetOptions,
  selectedVolumePreset,
  onMainTrackVolumeChange,
  onSecondaryTrackVolumeChange,
  onSelectedVolumePresetChange
}) {
  const { t } = useTranslation('trackMixer');
  const [mainTrackDuration] = useMediaDurations([mainTrack.sourceUrl]);
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
      <Select
        className="TrackMixer-volumePresetSelector"
        filterOption={false}
        value={selectedVolumePreset}
        options={volumePresetOptions}
        onSelect={onSelectedVolumePresetChange}
        />
      <div className="TrackMixer-tracks">
        <div className="TrackMixer-namesColumn">
          {tracks.map(trackInfo => (
            <div className="TrackMixer-nameRow" key={trackInfo.secondaryTrackIndex}>
              <div className="TrackMixer-name">{trackInfo.name}</div>
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
  secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    volume: PropTypes.number.isRequired
  })).isRequired,
  selectedVolumePreset: PropTypes.number.isRequired,
  volumePresetOptions: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string,
    value: PropTypes.number
  })).isRequired
};

export default TrackMixer;
