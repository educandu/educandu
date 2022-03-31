import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import NumberAndUnitInput from './number-and-unit-input.js';

const units = [
  { name: 'B', factor: 1 },
  { name: 'KB', factor: 1000 },
  { name: 'MB', factor: 1000000 },
  { name: 'GB', factor: 1000000000 }
];

function findOptimalUnitForValue(value) {
  for (let i = units.length - 1; i > 0; i -= 1) {
    const unit = units[i];
    if (value >= unit.factor && value % unit.factor === 0) {
      return unit.name;
    }
  }

  return units[0].name;
}

function getValueInUnit(value, unit) {
  return value / units.find(x => x.name === unit).factor;
}

function getByteValue(valueInUnit, unit) {
  return valueInUnit * units.find(x => x.name === unit).factor;
}

const unitOptions = units.map(unit => ({ value: unit.name, label: unit.name }));

function ByteInput({ value, onChange }) {
  const [lastValue, setLastValue] = useState(value);
  const [lastUnit, setLastUnit] = useState(findOptimalUnitForValue(lastValue));
  const [lastValueInUnit, setLastValueInUnit] = useState(getValueInUnit(lastValue, lastUnit));

  useEffect(() => {
    if (value !== lastValue) {
      setLastValue(value);
      setLastUnit(findOptimalUnitForValue(lastValue));
      setLastValueInUnit(getValueInUnit(lastValue, lastUnit));
    }
  }, [value, lastValue, lastUnit]);

  const handleChange = ({ number, unit }) => {
    const newByteValue = getByteValue(number, unit);
    setLastUnit(unit);
    setLastValueInUnit(number);
    setLastValue(newByteValue);
    onChange(newByteValue);
  };

  return (
    <NumberAndUnitInput
      className="ByteInput"
      value={{ number: lastValueInUnit, unit: lastUnit }}
      unitOptions={unitOptions}
      onChange={handleChange}
      numberFieldProps={{ className: 'ByteInput-numberField' }}
      unitFieldProps={{ className: 'ByteInput-unitField' }}
      />
  );
}

ByteInput.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.number
};

ByteInput.defaultProps = {
  onChange: () => {},
  value: 0
};

export default ByteInput;
