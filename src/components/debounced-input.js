import { Input } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDebouncedCallback } from '../ui/hooks.js';

function DebouncedInput({ elementType: Component, value, onChange, onEnter, onSearch, ...props }) {
  const [actualValue, setActualValue] = useState(value);
  const debouncedOnChange = useDebouncedCallback(onChange, 250);

  useEffect(() => {
    setActualValue(value);
  }, [value]);

  const handleChange = event => {
    setActualValue(event.target.value);
    debouncedOnChange(event.target.value);
  };

  const componentProps = { ...props };

  if (onEnter) {
    componentProps.onEnter = () => onEnter(actualValue);
  }

  if (onSearch) {
    componentProps.onSearch = () => onSearch(actualValue);
  }

  return <Component {...componentProps} value={actualValue} onChange={handleChange} />;
}

DebouncedInput.propTypes = {
  elementType: PropTypes.elementType,
  onChange: PropTypes.func,
  onEnter: PropTypes.func,
  onSearch: PropTypes.func,
  value: PropTypes.string
};

DebouncedInput.defaultProps = {
  elementType: Input,
  onChange: () => {},
  onEnter: null,
  onSearch: null,
  value: ''
};

export default DebouncedInput;
