import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useMediaDurations } from './media-hooks.js';
import MediaVolumeSlider from './media-volume-slider.js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { formatMillisecondsAsDuration } from '../../utils/media-utils.js';

const ALLOWED_TRACK_BAR_OVERFLOW_IN_PX = 10;

function TrackMixer({
  mainTrack,
  secondaryTracks,
  onMainTrackChange,
  onSecondaryTrackChange
}) {
  const barsColumnRef = useRef(null);
  const { t } = useTranslation('trackMixer');

  const [trackInfos, setTrackInfos] = useState([]);
  const [mainTrackDuration] = useMediaDurations([mainTrack.sourceUrl]);
  const secondaryTrackDurations = useMediaDurations(secondaryTracks.map(track => track.sourceUrl));

  const updateTrackInfos = useCallback(() => {
    const barsColumnWidth = barsColumnRef.current?.clientWidth || 0;
    const mainTrackDurationInMs = (mainTrack.playbackRange[1] - mainTrack.playbackRange[0]) * (mainTrackDuration.duration || 0);

    let getBarWidthForTrack;
    if (barsColumnWidth && mainTrackDurationInMs) {
      const msToPxRatio = barsColumnWidth / mainTrackDurationInMs;
      const maxBarWidth = barsColumnWidth + ALLOWED_TRACK_BAR_OVERFLOW_IN_PX;
      getBarWidthForTrack = trackDuration => Math.min(maxBarWidth, trackDuration * msToPxRatio);
    } else {
      getBarWidthForTrack = () => 0;
    }

    setTrackInfos([
      {
        name: mainTrack.name,
        volume: mainTrack.volume,
        secondaryTrackIndex: -1,
        trackDurationInMs: mainTrackDurationInMs || 0,
        barWidth: getBarWidthForTrack(mainTrackDurationInMs || 0)
      },
      ...secondaryTracks.map((secondaryTrack, index) => ({
        name: secondaryTrack.name,
        volume: secondaryTrack.volume,
        secondaryTrackIndex: index,
        trackDurationInMs: secondaryTrackDurations[index].duration || 0,
        barWidth: getBarWidthForTrack(secondaryTrackDurations[index].duration || 0)
      }))
    ]);
  }, [barsColumnRef, mainTrack, secondaryTracks, mainTrackDuration, secondaryTrackDurations]);

  useEffect(() => {
    updateTrackInfos();
  }, [updateTrackInfos]);

  useEffect(() => {
    window.addEventListener('resize', updateTrackInfos);
    return () => {
      window.removeEventListener('resize', updateTrackInfos);
    };
  }, [updateTrackInfos]);

  const handleTrackVolumeChange = (trackInfo, volume) => {
    const index = trackInfo.secondaryTrackIndex;
    if (index === -1) {
      onMainTrackChange({ ...mainTrack, volume });
    } else {
      onSecondaryTrackChange(index, { ...secondaryTracks[index], volume });
    }
  };

  return (
    <div className="TrackMixer">
      <div className="TrackMixer-namesColumn">
        {trackInfos.map(trackInfo => (
          <div className="TrackMixer-nameRow" key={trackInfo.secondaryTrackIndex}>
            <div className="TrackMixer-name">{trackInfo.name}</div>
            <MediaVolumeSlider value={trackInfo.volume} onChange={value => handleTrackVolumeChange(trackInfo, value)} />
          </div>
        ))}
      </div>
      <div className="TrackMixer-barsColumn" ref={barsColumnRef}>
        {trackInfos.map(trackInfo => (
          <div className="TrackMixer-barRow" key={trackInfo.secondaryTrackIndex}>
            {!!trackInfo.trackDurationInMs && (
              <div
                className={classNames({
                  'TrackMixer-bar': true,
                  'TrackMixer-bar--secondaryTrack': trackInfo.secondaryTrackIndex !== -1
                })}
                style={{ width: `${trackInfo.barWidth}px` }}
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
      </div>
    </div>
  );
}

TrackMixer.propTypes = {
  mainTrack: PropTypes.shape({
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    playbackRange: PropTypes.arrayOf(PropTypes.number).isRequired,
    volume: PropTypes.number.isRequired
  }).isRequired,
  onMainTrackChange: PropTypes.func.isRequired,
  onSecondaryTrackChange: PropTypes.func.isRequired,
  secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    sourceUrl: PropTypes.string,
    volume: PropTypes.number.isRequired
  })).isRequired
};

export default TrackMixer;
