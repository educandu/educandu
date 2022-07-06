import React from 'react';
import { Slider } from 'antd';
import PropTypes from 'prop-types';
import { range } from '../utils/array-utils.js';

const possibleValues = range({ from: 0, to: 100, step: 5 });
const maxValue = possibleValues[possibleValues.length - 1];

const marks = possibleValues.reduce((all, val) => {
  const markLabel = val % 20 === 0 ? `${val}%` : '';
  const node = <span>{markLabel}</span>;
  return { ...all, [val]: node };
}, {});

const tipFormatter = val => `${val}%`;

function ObjectWidthSlider({ value, onChange }) {
  return (
    <div>
      <Slider
        min={0}
        max={maxValue}
        marks={marks}
        step={null}
        value={value}
        onChange={onChange}
        tipFormatter={tipFormatter}
        />
    </div>
  );
}

ObjectWidthSlider.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number.isRequired
};

export default ObjectWidthSlider;
