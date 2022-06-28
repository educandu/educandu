import React from 'react';
import { Slider } from 'antd';
import PropTypes from 'prop-types';

const possibleValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const maxValue = possibleValues[possibleValues.length - 1];
const marks = possibleValues.reduce((all, val) => {
  const node = <span>{`${val}%`}</span>;
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
