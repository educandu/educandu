import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Slider } from 'antd';
import MuteIcon from './icons/media-player/mute-icon.js';
import VolumeIcon from './icons/media-player/volume-icon.js';

function VolumeSlider({ value, onChange }) {
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
    <div className="VolumeSlider">
      <Button type="link" icon={isMuted ? <MuteIcon /> : <VolumeIcon />} onClick={handleVolumeButtonClick} />
      <Slider
        className="VolumeSlider-slider"
        min={0}
        max={100}
        disabled={isMuted}
        onChange={handleSliderChange}
        tipFormatter={val => `${val}%`}
        value={isMuted ? 0 : value * 100}
        />
    </div>
  );
}

VolumeSlider.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired
};

export default VolumeSlider;
