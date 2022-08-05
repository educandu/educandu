import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import VolumeSlider from './volume-slider.js';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';
import { CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons';

let trackBarInterval;

function TrackMixer({
  mainTrack,
  secondaryTracks,
  mainTrackDurationInMs,
  secondaryTracksDurationsInMs,
  onMainTrackChange,
  onSecondaryTrackChange
}) {
  const handleTrackBarArrowMouseDown = (index, directionUnit) => {
    if (trackBarInterval) {
      clearInterval(trackBarInterval);
      trackBarInterval = null;
    }

    let offsetTimecode = secondaryTracks[index].offsetTimecode;

    trackBarInterval = setInterval(() => {
      if (trackBarInterval) {
        offsetTimecode += 1000 * directionUnit;
        onSecondaryTrackChange(index, { ...secondaryTracks[index], offsetTimecode });
      }
    }, 100);
  };

  const handleTrackBarArrowMouseUp = () => {
    clearInterval(trackBarInterval);
    trackBarInterval = null;
  };

  const handleMainTrackVolumeChange = volume => {
    onMainTrackChange({ ...mainTrack, volume });
  };

  const handleSecondaryTrackVolumeChange = (index, volume) => {
    onSecondaryTrackChange(index, { ...secondaryTracks[index], volume });
  };

  const renderSecondaryTrackNameRow = (secondaryTrack, index) => {
    return (
      <div className="TrackMixer-nameRow" key={index}>
        <div className="TrackMixer-name">{secondaryTrack.name}</div>
        <VolumeSlider value={secondaryTrack.volume} onChange={value => handleSecondaryTrackVolumeChange(index, value)} />
      </div>
    );
  };

  // eslint-disable-next-line no-console
  console.log(secondaryTracks[0].offsetTimecode);

  const renderSecondaryTrackBarRow = (secondaryTrack, index) => {
    const duration = secondaryTracksDurationsInMs[index];
    const widthInPercentage = Math.round(mainTrackDurationInMs ? duration * 100 / mainTrackDurationInMs : 0);
    const offsetInPercentage = Math.round(mainTrackDurationInMs ? secondaryTrack.offsetTimecode * 100 / mainTrackDurationInMs : 0);

    const marginLeftInPercentage = offsetInPercentage > 0 ? offsetInPercentage : 0;
    const actualWidthInPercentage = (marginLeftInPercentage + widthInPercentage) <= 100
      ? widthInPercentage
      : widthInPercentage - marginLeftInPercentage;

    return (
      <div className="TrackMixer-barRow" key={index}>
        <div
          className="TrackMixer-bar TrackMixer-bar--secondaryTrack"
          style={{ marginLeft: `${marginLeftInPercentage}%`, width: `${actualWidthInPercentage}%` }}
          />
        {offsetInPercentage < 0 && (
          <div className="TrackMixer-barOverflow TrackMixer-barOverflow--left" />
        )}
        {(widthInPercentage > 100 || (offsetInPercentage + widthInPercentage) > 100) && (
          <div className="TrackMixer-barOverflow TrackMixer-barOverflow--right" />
        )}
        <div className="TrackMixer-barArrow TrackMixer-barArrow--left">
          <Button
            type="link"
            size="small"
            icon={<CaretLeftOutlined />}
            onMouseDown={() => handleTrackBarArrowMouseDown(index, -1)}
            onMouseUp={() => handleTrackBarArrowMouseUp()}
            />
        </div>
        <div className="TrackMixer-barArrow TrackMixer-barArrow--right">
          <Button
            type="link"
            size="small"
            icon={<CaretRightOutlined />}
            onMouseDown={() => handleTrackBarArrowMouseDown(index, 1)}
            onMouseUp={() => handleTrackBarArrowMouseUp()}
            />
        </div>
      </div>
    );
  };

  return (
    <div className="TrackMixer">
      <div className="TrackMixer-namesColumn">
        <div className="TrackMixer-nameRow">
          <div className="TrackMixer-name">{mainTrack.name}</div>
          <VolumeSlider value={mainTrack.volume} onChange={handleMainTrackVolumeChange} />
        </div>
        {secondaryTracks.map(renderSecondaryTrackNameRow)}
      </div>

      <div className="TrackMixer-barsColumn">
        <div className="TrackMixer-barRow">
          <div className="TrackMixer-barRowDuration">
            <span>{formatMillisecondsAsDuration(0)}</span>
            <span>{formatMillisecondsAsDuration(mainTrackDurationInMs)}</span>
          </div>
          <div className="TrackMixer-bar" />
        </div>
        {secondaryTracks.map(renderSecondaryTrackBarRow)}
      </div>
    </div>
  );
}

TrackMixer.propTypes = {
  mainTrack: PropTypes.shape({
    name: PropTypes.string,
    volume: PropTypes.number.isRequired
  }).isRequired,
  mainTrackDurationInMs: PropTypes.number.isRequired,
  onMainTrackChange: PropTypes.func.isRequired,
  onSecondaryTrackChange: PropTypes.func.isRequired,
  secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    offsetTimecode: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired
  })).isRequired,
  secondaryTracksDurationsInMs: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default TrackMixer;
