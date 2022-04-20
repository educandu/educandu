import { Input } from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useDebouncedCallback } from '../ui/hooks.js';

const { TextArea } = Input;

function DebouncedTextArea({ value, onChange, ...props }) {
  const [actualValue, setActualValue] = useState(value);
  const debouncedOnChange = useDebouncedCallback(onChange, 250);

  const handleChange = event => {
    setActualValue(event.target.value);
    debouncedOnChange(event.target.value);
  };

  return <TextArea {...props} value={actualValue} onChange={handleChange} />;
}

DebouncedTextArea.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string
};

DebouncedTextArea.defaultProps = {
  onChange: () => {},
  value: ''
};

export default DebouncedTextArea;
