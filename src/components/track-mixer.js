import React from 'react';
import { Button } from 'antd';
import PropTypes from 'prop-types';
import VolumeSlider from './volume-slider.js';
import { formatMillisecondsAsDuration } from '../utils/media-utils.js';
import { CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons';

function TrackMixer({ mainTrack, secondaryTracks, playbackDuration, onMainTrackVolumeChange, onSecondaryTrackVolumeChange }) {

  const handleSecondaryTrackBarLeftArrowClick = index => {
    console.log('left', index);
  };

  const handleSecondaryTrackBarRightArrowClick = index => {
    console.log('right', index);
  };

  const renderSecondaryTrackNameRow = (secondaryTrack, index) => {
    return (
      <div className="TrackMixer-nameRow" key={index}>
        <div className="TrackMixer-name">{secondaryTrack.name}</div>
        <VolumeSlider value={secondaryTrack.volume} onChange={value => onSecondaryTrackVolumeChange(index, value)} />
      </div>
    );
  };

  const renderSecondaryTrackBarRow = (secondaryTrack, index) => {
    return (
      <div className="TrackMixer-barRow" key={index}>
        <div className="TrackMixer-bar TrackMixer-bar--secondaryTrack" />
        <div className="TrackMixer-barArrow TrackMixer-barArrow--left">
          <Button type="link" size="small" icon={<CaretLeftOutlined />} onClick={() => handleSecondaryTrackBarLeftArrowClick(index)} />
        </div>
        <div className="TrackMixer-barArrow TrackMixer-barArrow--right">
          <Button type="link" size="small" icon={<CaretRightOutlined />} onClick={() => handleSecondaryTrackBarRightArrowClick(index)} />
        </div>
      </div>
    );
  };

  return (
    <div className="TrackMixer">
      <div className="TrackMixer-namesColumn">
        <div className="TrackMixer-nameRow">
          <div className="TrackMixer-name">{mainTrack.name}</div>
          <VolumeSlider value={mainTrack.volume} onChange={onMainTrackVolumeChange} />
        </div>
        {secondaryTracks.map(renderSecondaryTrackNameRow)}
      </div>

      <div className="TrackMixer-barsColumn">
        <div className="TrackMixer-barRow">
          <div className="TrackMixer-barRowDuration">
            <span>{formatMillisecondsAsDuration(0)}</span>
            <span>{formatMillisecondsAsDuration(playbackDuration)}</span>
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
  onMainTrackVolumeChange: PropTypes.func.isRequired,
  onSecondaryTrackVolumeChange: PropTypes.func.isRequired,
  playbackDuration: PropTypes.number.isRequired,
  secondaryTracks: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    offsetTimecode: PropTypes.number.isRequired,
    volume: PropTypes.number.isRequired
  })).isRequired
};

export default TrackMixer;
