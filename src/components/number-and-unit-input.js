import React from 'react';
import PropTypes from 'prop-types';
import { InputNumber, Select } from 'antd';

function NumberAndUnitInput({ value, unitOptions, className, numberFieldProps, unitFieldProps, onChange }) {
  const { number, unit } = value;

  const onNumberChange = newNumber => {
    onChange({ ...value, number: newNumber });
  };

  const onUnitChange = newUnit => {
    onChange({ ...value, unit: newUnit });
  };

  return (
    <span className={className}>
      <InputNumber
        {...numberFieldProps}
        value={number}
        onChange={onNumberChange}
        />
      <Select
        {...unitFieldProps}
        value={unit}
        onChange={onUnitChange}
        options={unitOptions}
        />
    </span>
  );
}

NumberAndUnitInput.propTypes = {
  className: PropTypes.string,
  numberFieldProps: PropTypes.object,
  onChange: PropTypes.func,
  unitFieldProps: PropTypes.object,
  unitOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  value: PropTypes.shape({
    number: PropTypes.number.isRequired,
    unit: PropTypes.string.isRequired
  }).isRequired
};

NumberAndUnitInput.defaultProps = {
  className: '',
  numberFieldProps: {},
  onChange: () => {},
  unitFieldProps: {}
};

export default NumberAndUnitInput;
