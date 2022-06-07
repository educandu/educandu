import React from 'react';
import { Input } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';

const { TextArea } = Input;

function MarkdownTextarea({ value, disabled, onChange }) {

  const handleOnChange = newValue => {
    onChange(newValue);
  };

  return (
    <div className="MarkdownTextarea">
      <TextArea style={{ height: '100%', resize: 'none' }} value={value} disabled={disabled} onChange={handleOnChange} />
      <div className={classNames('MarkdownTextarea-preview', { 'is-disabled': disabled })}>
        <Markdown renderMedia>{value}</Markdown>
      </div>
    </div>
  );
}

MarkdownTextarea.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  value: PropTypes.string
};

MarkdownTextarea.defaultProps = {
  disabled: false,
  onChange: () => '',
  value: ''
};

export default MarkdownTextarea;
