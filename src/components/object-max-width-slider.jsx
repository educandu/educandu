const React = require('react');
const { Slider } = require('antd');
const PropTypes = require('prop-types');
const browserHelper = require('../ui/browser-helper');

const possibleValues = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const maxValue = possibleValues[possibleValues.length - 1];
const marks = possibleValues.reduce((all, val) => {
  const node = <span>{`${val}%`}</span>;
  return { ...all, [val]: node };
}, {});
const tipFormatter = val => `${val}%`;

function ObjectMaxWidthSlider({ value, defaultValue, onChange }) {
  let val = value;

  if (typeof val !== 'number' || !possibleValues.includes(val)) {
    val = defaultValue;

    if (browserHelper.isBrowser()) {
      setTimeout(() => onChange(val), 0);
    }
  }

  return (
    <div>
      <Slider
        min={0}
        max={maxValue}
        marks={marks}
        step={null}
        value={val}
        onChange={onChange}
        tipFormatter={tipFormatter}
        />
    </div>
  );
}

ObjectMaxWidthSlider.propTypes = {
  defaultValue: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.number
};

ObjectMaxWidthSlider.defaultProps = {
  defaultValue: maxValue,
  value: null
};

module.exports = ObjectMaxWidthSlider;
