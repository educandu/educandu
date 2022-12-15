import PropTypes from 'prop-types';
import { Button, Slider } from 'antd';
import React, { useEffect, useState } from 'react';
import MuteIcon from '../icons/media-player/mute-icon.js';
import { usePercentageFormat } from '../locale-context.js';
import VolumeIcon from '../icons/media-player/volume-icon.js';

export const MEDIA_VOLUME_SLIDER_ORIENTATION = {
  horizontal: 'horizontal',
  vertical: 'vertical'
};

function MediaVolumeSlider({ value, onChange, orientation }) {
  const percentageFormatter = usePercentageFormat();
  const [lastValueBeforeMuting, setLastValueBeforeMuting] = useState(value);

  useEffect(() => {
    if (value > 0) {
      setLastValueBeforeMuting(value);
    }
  }, [value]);

  const handleVolumeButtonClick = () => {
    onChange(value ? 0 : lastValueBeforeMuting);
  };

  const handleSliderChange = newValue => {
    onChange(newValue);
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
        max={1}
        step={0.01}
        value={value}
        onChange={handleSliderChange}
        tooltip={{ formatter: percentageFormatter }}
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
