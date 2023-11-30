import PropTypes from 'prop-types';
import { Button, Slider, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { ORIENTATION } from '../../domain/constants.js';
import MuteIcon from '../icons/media-player/mute-icon.js';
import WarningIcon from '../icons/general/warning-icon.js';
import { usePercentageFormat } from '../locale-context.js';
import VolumeIcon from '../icons/media-player/volume-icon.js';

function MediaVolumeSlider({ value, orientation, useButton, useValueLabel, disabled, showIOSWarning, onChange }) {
  const { t } = useTranslation('mediaVolumeSlider');
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
      {!!useButton && (
        <Button
          type="link"
          disabled={disabled}
          icon={value === 0 ? <MuteIcon /> : <VolumeIcon />}
          onClick={handleVolumeButtonClick}
          />
      )}
      <Slider
        className={`MediaVolumeSlider-slider MediaVolumeSlider-slider--${orientation}`}
        min={0}
        max={1}
        step={0.01}
        value={value}
        disabled={disabled}
        onChange={handleSliderChange}
        vertical={orientation === ORIENTATION.vertical}
        tooltip={disabled || useValueLabel ? { open: false } : { formatter: percentageFormatter }}
        />
      {!!useValueLabel && (
        <div className="MediaVolumeSlider-sliderValueLabel">{percentageFormatter(value)}</div>
      )}
      {!!showIOSWarning && (
        <Tooltip title={t('iOSWarning')}>
          <WarningIcon className="MediaVolumeSlider-warningIcon" />
        </Tooltip>
      )}
    </div>
  );
}

MediaVolumeSlider.propTypes = {
  value: PropTypes.number.isRequired,
  orientation: PropTypes.oneOf(Object.values(ORIENTATION)),
  useButton: PropTypes.bool,
  useValueLabel: PropTypes.bool,
  disabled: PropTypes.bool,
  showIOSWarning: PropTypes.bool,
  onChange: PropTypes.func.isRequired
};

MediaVolumeSlider.defaultProps = {
  orientation: ORIENTATION.horizontal,
  useButton: true,
  useValueLabel: false,
  disabled: false,
  showIOSWarning: false
};

export default MediaVolumeSlider;
