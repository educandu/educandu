import PropTypes from 'prop-types';
import { Button, Slider } from 'antd';
import React, { useState } from 'react';
import MuteIcon from '../icons/media-player/mute-icon.js';
import VolumeIcon from '../icons/media-player/volume-icon.js';

function MediaVolumeSlider({ value, onChange }) {
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
    <div className="MediaVolumeSlider">
      <Button type="link" icon={isMuted ? <MuteIcon /> : <VolumeIcon />} onClick={handleVolumeButtonClick} />
      <Slider
        className="MediaVolumeSlider-slider"
        min={0}
        max={100}
        disabled={isMuted}
        onChange={handleSliderChange}
        tipFormatter={isMuted ? null : val => `${val}%`}
        value={isMuted ? 0 : value * 100}
        />
    </div>
  );
}

MediaVolumeSlider.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired
};

export default MediaVolumeSlider;
