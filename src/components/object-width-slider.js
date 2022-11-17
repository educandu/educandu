import React from 'react';
import PropTypes from 'prop-types';
import StepSlider from './step-slider.js';
import { usePercentageFormat } from './locale-context.js';

function ObjectWidthSlider({ value, onChange }) {
  const formatPercentage = usePercentageFormat({ integerMode: true });
  return (
    <StepSlider
      min={0}
      step={5}
      max={100}
      value={value}
      marksStep={5}
      labelsStep={20}
      onChange={onChange}
      formatter={formatPercentage}
      />
  );
}

ObjectWidthSlider.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired
};

export default ObjectWidthSlider;
