import React from 'react';
import PropTypes from 'prop-types';
import { Button, Slider } from 'antd';
import MuteIcon from '../icons/media-player/mute-icon.js';
import VolumeIcon from '../icons/media-player/volume-icon.js';

export const MEDIA_VOLUME_SLIDER_ORIENTATION = {
  horizontal: 'horizontal',
  vertical: 'vertical'
};

function MediaVolumeSlider({ value, onChange, orientation }) {
  const handleVolumeButtonClick = () => {
    onChange(value ? 0 : 1);
  };

  const handleSliderChange = newValue => {
    onChange(newValue / 100);
  };

  return (
    <div className={`MediaVolumeSlider MediaVolumeSlider--${orientation}`}>
      <Button
        type="link"
        icon={value === 0 ? <MuteIcon /> : <VolumeIcon />}
        onClick={handleVolumeButtonClick}
        />
      <Slider
        className={`MediaVolumeSlider-slider MediaVolumeSlider-slider--${orientation}`}
        min={0}
        max={100}
        value={value * 100}
        onChange={handleSliderChange}
        tipFormatter={val => `${val}%`}
        vertical={orientation === MEDIA_VOLUME_SLIDER_ORIENTATION.vertical}
        />
    </div>
  );
}

MediaVolumeSlider.propTypes = {
  onChange: PropTypes.func.isRequired,
  orientation: PropTypes.oneOf(Object.values(MEDIA_VOLUME_SLIDER_ORIENTATION)),
  value: PropTypes.number.isRequired
};

MediaVolumeSlider.defaultProps = {
  orientation: MEDIA_VOLUME_SLIDER_ORIENTATION.horizontal
};

export default MediaVolumeSlider;