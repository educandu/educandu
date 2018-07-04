const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const Slider = require('antd/lib/slider');
const browserHelper = require('../ui/browser-helper');

const possibleValues = [25, 33, 50, 66, 75, 100];
const maxValue = possibleValues[possibleValues.length - 1];
const marks = possibleValues.reduce((all, val) => {
  const classes = classNames({
    'ObjectMaxWidthSlider-tick': true,
    'ObjectMaxWidthSlider-tick--quarter': val % 25 === 0,
    'ObjectMaxWidthSlider-tick--third': val % 33 === 0
  });
  const node = <span className={classes}>{`${val}%`}</span>;
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
    <div className="ObjectMaxWidthSlider">
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
