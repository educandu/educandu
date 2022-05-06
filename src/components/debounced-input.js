import { Input } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDebouncedCallback } from '../ui/hooks.js';

function DebouncedInput({ value, onChange, ...props }) {
  const [actualValue, setActualValue] = useState(value);
  const debouncedOnChange = useDebouncedCallback(onChange, 250);

  useEffect(() => {
    setActualValue(value);
  }, [value]);

  const handleChange = event => {
    setActualValue(event.target.value);
    debouncedOnChange(event.target.value);
  };

  return <Input {...props} value={actualValue} onChange={handleChange} />;
}

DebouncedInput.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string
};

DebouncedInput.defaultProps = {
  onChange: () => {},
  value: ''
};

export default DebouncedInput;
