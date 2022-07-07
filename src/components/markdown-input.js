import React from 'react';
import { Input } from 'antd';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import MarkdownHelp from './markdown-help.js';
import InputAndPreview from './input-and-preview.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';

function MarkdownInput({ minRows, disabled, inline, renderMedia, value, onChange, preview, embeddable, ...rest }) {
  const renderInlineInput = () => (
    <Input
      {...rest}
      className={classNames('MarkdownInput-input', { 'is-disabled': disabled })}
      value={value}
      onChange={onChange}
      disabled={disabled}
      addonAfter={<MarkdownHelp disabled={disabled} inline />}
      />
  );

  const renderBlockInput = () => (
    <div className="MarkdownInput-textareaContainer">
      <NeverScrollingTextArea
        {...rest}
        className="MarkdownInput-textarea"
        value={value}
        onChange={onChange}
        disabled={disabled}
        minRows={minRows}
        embeddable={embeddable}
        />
      <div
        className={classNames(
          'MarkdownInput-blockHelpContainer',
          { 'MarkdownInput-blockHelpContainer--embeddable': embeddable }
        )}
        >
        <MarkdownHelp size={embeddable ? 'small' : 'normal'} disabled={disabled} />
      </div>
    </div>
  );

  const renderInput = () => inline ? renderInlineInput() : renderBlockInput();

  const renderPreview = () => (
    <Markdown
      className={classNames('MarkdownInput-preview', { 'MarkdownInput-preview--inline': inline })}
      inline={inline}
      renderMedia={renderMedia}
      >
      {value}
    </Markdown>
  );

  return (
    <div className="MarkdownInput">
      {preview ? <InputAndPreview input={renderInput()} preview={renderPreview()} /> : renderInput()}
    </div>
  );
}

MarkdownInput.propTypes = {
  disabled: PropTypes.bool,
  embeddable: PropTypes.bool,
  inline: PropTypes.bool,
  minRows: PropTypes.number,
  onChange: PropTypes.func,
  preview: PropTypes.bool,
  renderMedia: PropTypes.bool,
  value: PropTypes.string
};

MarkdownInput.defaultProps = {
  disabled: false,
  embeddable: false,
  inline: false,
  minRows: 3,
  onChange: () => '',
  preview: false,
  renderMedia: false,
  value: ''
};

export default MarkdownInput;
