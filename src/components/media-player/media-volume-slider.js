import PropTypes from 'prop-types';
import { Button, Slider } from 'antd';
import React, { useState } from 'react';
import MuteIcon from '../icons/media-player/mute-icon.js';
import VolumeIcon from '../icons/media-player/volume-icon.js';

export const MEDIA_VOLUME_SLIDER_ORIENTATION = {
  horizontal: 'horizontal',
  vertical: 'vertical'
};

function MediaVolumeSlider({ value, onChange, orientation }) {
  const [isMuted, setIsMuted] = useState(value === 0);
  const [valueBeforeMuted, setValueBeforeMuted] = useState(value);

  const handleVolumeButtonClick = () => {
    if (isMuted) {
      onChange(valueBeforeMuted);
      setIsMuted(false);
    } else {
      setValueBeforeMuted(value);
      onChange(0);
      setIsMuted(true);
    }
  };

  const handleSliderChange = newValue => {
    onChange(newValue / 100);
  };

  return (
    <div className={`MediaVolumeSlider MediaVolumeSlider--${orientation}`}>
      <Button type="link" icon={isMuted ? <MuteIcon /> : <VolumeIcon />} onClick={handleVolumeButtonClick} />
      <Slider
        className={`MediaVolumeSlider-slider MediaVolumeSlider-slider--${orientation}`}
        min={0}
        max={100}
        disabled={isMuted}
        onChange={handleSliderChange}
        tipFormatter={isMuted ? null : val => `${val}%`}
        value={isMuted ? 0 : value * 100}
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
