import { Slider } from 'antd';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { range } from '../utils/array-utils.js';
import { useNumberFormat } from './locale-context.js';

function StepSlider({ min, max, step, marksStep, labelsStep, formatter, ...sliderProps }) {
  const formatNumber = useNumberFormat();

  const actualFormatter = formatter || formatNumber;

  const marks = useMemo(() => {
    const allValues = range({ from: min, to: max, step });
    const allMarkValues = new Set(marksStep ? range({ from: min, to: max, step: marksStep }) : []);
    const allLabelValues = new Set(labelsStep ? range({ from: min, to: max, step: labelsStep }) : []);

    if (allValues[allValues.length - 1] !== max) {
      throw new Error(`Max value ${max} cannot be reached from min value ${min} using step ${step}`);
    }

    return allValues.reduce((accu, val) => {
      const shouldRenderMark = allMarkValues.has(val);
      const markLabel = allLabelValues.has(val) ? actualFormatter(val) : '';
      if (shouldRenderMark || markLabel) {
        accu[val] = <span>{markLabel}</span>;
      }
      return accu;
    }, {});
  }, [min, max, step, marksStep, labelsStep, actualFormatter]);

  return (
    <Slider
      {...sliderProps}
      min={min}
      max={max}
      step={step}
      marks={marks}
      tooltip={{ formatter: actualFormatter }}
      />
  );
}

StepSlider.propTypes = {
  formatter: PropTypes.func,
  labelsStep: PropTypes.number,
  marksStep: PropTypes.number,
  max: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  step: PropTypes.number.isRequired
};

StepSlider.defaultProps = {
  formatter: null,
  labelsStep: null,
  marksStep: null
};

export default StepSlider;
