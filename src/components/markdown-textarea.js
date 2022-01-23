import React from 'react';
import { Input } from 'antd';
import PropTypes from 'prop-types';
import Markdown from './markdown.js';

const { TextArea } = Input;

function MarkdownTextarea({ value, onChange }) {

  const handleOnChange = newValue => {
    onChange(newValue);
  };

  return (
    <div className="MarkdownTextarea">
      <TextArea style={{ height: '100%', resize: 'none' }} value={value} onChange={handleOnChange} />
      <div className="MarkdownTextarea-preview">
        <Markdown renderMedia>{value}</Markdown>
      </div>
    </div>
  );
}

MarkdownTextarea.defaultProps = {
  onChange: () => '',
  value: ''
};

MarkdownTextarea.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string
};

export default MarkdownTextarea;
