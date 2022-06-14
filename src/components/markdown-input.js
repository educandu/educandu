import React from 'react';
import { Input } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import MarkdownHelp from './markdown-help.js';

const { TextArea } = Input;

function MarkdownInput({ autoSize, className, disabled, inline, renderMedia, value, onChange, preview, noHelp, ...rest }) {
  return (
    <div className={classNames('MarkdownInput', { 'MarkdownInput--withPreview': preview })}>
      {inline && (
        <Input
          {...rest}
          className={classNames('MarkdownInput-input', { 'is-disabled': disabled }, className)}
          value={value}
          onChange={onChange}
          disabled={disabled}
          addonAfter={noHelp ? null : <MarkdownHelp disabled={disabled} inline />}
          />
      )}
      {!inline && (
        <div className={classNames('MarkdownInput-textareaContainer', { 'MarkdownInput-textareaContainer--noAutoSize': preview })}>
          <TextArea
            {...rest}
            className={classNames('MarkdownInput-textarea', { 'MarkdownInput-textarea--noAutoSize': preview }, className)}
            value={value}
            onChange={onChange}
            disabled={disabled}
            autoSize={preview ? false : autoSize}
            />
          {!noHelp && (
            <div className="MarkdownInput-blockHelpContainer">
              <MarkdownHelp disabled={disabled} />
            </div>
          )}
        </div>
      )}
      {preview && (
        <div className={classNames('MarkdownInput-preview', { 'MarkdownInput-preview--inline': inline, 'is-disabled': disabled })}>
          <Markdown inline={inline} renderMedia={renderMedia}>{value}</Markdown>
        </div>
      )}
    </div>
  );
}

MarkdownInput.propTypes = {
  autoSize: PropTypes.shape({
    minRows: PropTypes.number,
    maxRows: PropTypes.number
  }),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  inline: PropTypes.bool,
  noHelp: PropTypes.bool,
  onChange: PropTypes.func,
  preview: PropTypes.bool,
  renderMedia: PropTypes.bool,
  value: PropTypes.string
};

MarkdownInput.defaultProps = {
  autoSize: { minRows: 3 },
  className: '',
  disabled: false,
  inline: false,
  noHelp: false,
  onChange: () => '',
  preview: false,
  renderMedia: false,
  value: ''
};

export default MarkdownInput;
