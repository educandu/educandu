import { Input } from 'antd';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDebouncedCallback } from '../ui/hooks.js';

function DebouncedInput({ apiRef, timeLimit, elementType: Component, value, onChange, onSearch, onPressEnter, ...props }) {
  const [actualValue, setActualValue] = useState(value);
  const debouncedOnChange = useDebouncedCallback(onChange, timeLimit);

  apiRef.current = {
    flush: () => debouncedOnChange.flush()
  };

  useEffect(() => {
    setActualValue(value);
  }, [value]);

  const handleChange = event => {
    setActualValue(event.target.value);
    debouncedOnChange(event.target.value);
  };

  const componentProps = { ...props };

  if (onSearch) {
    componentProps.onSearch = (...args) => {
      debouncedOnChange.flush();
      onSearch(...args);
    };
  }

  if (onPressEnter) {
    componentProps.onPressEnter = (...args) => {
      debouncedOnChange.flush();
      onPressEnter(...args);
    };
  }

  return <Component {...componentProps} value={actualValue} onChange={handleChange} />;
}

DebouncedInput.propTypes = {
  apiRef: PropTypes.object,
  elementType: PropTypes.elementType,
  onChange: PropTypes.func,
  onPressEnter: PropTypes.func,
  onSearch: PropTypes.func,
  timeLimit: PropTypes.number,
  value: PropTypes.string
};

DebouncedInput.defaultProps = {
  apiRef: { current: null },
  elementType: Input,
  onChange: () => {},
  onPressEnter: null,
  onSearch: null,
  timeLimit: 250,
  value: ''
};

export default DebouncedInput;
