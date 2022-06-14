import { Input } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDebouncedCallback } from '../ui/hooks.js';

function DebouncedInput({ elementType: Component, value, onChange, ...props }) {
  const [actualValue, setActualValue] = useState(value);
  const debouncedOnChange = useDebouncedCallback(onChange, 250);

  useEffect(() => {
    setActualValue(value);
  }, [value]);

  const handleChange = event => {
    setActualValue(event.target.value);
    debouncedOnChange(event.target.value);
  };

  return <Component {...props} value={actualValue} onChange={handleChange} />;
}

DebouncedInput.propTypes = {
  elementType: PropTypes.elementType,
  onChange: PropTypes.func,
  value: PropTypes.string
};

DebouncedInput.defaultProps = {
  elementType: Input,
  onChange: () => {},
  value: ''
};

export default DebouncedInput;
