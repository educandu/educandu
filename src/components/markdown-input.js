import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { Input, Tooltip } from 'antd';
import MarkdownHelp from './markdown-help.js';
import { useTranslation } from 'react-i18next';
import InputAndPreview from './input-and-preview.js';
import PreviewIcon from './icons/general/preview-icon.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';

function MarkdownInput({ minRows, disabled, inline, value, onChange, preview, embeddable, maxLength, ...rest }) {
  const { t } = useTranslation('markdownInput');

  const renderCount = () => {
    return maxLength
      ? <div className="MarkdownInput-count">{value.length} / {maxLength}</div>
      : null;
  };

  const renderInlineInput = () => (
    <div className="MarkdownInput-inlineInputContainer">
      <Input
        {...rest}
        className={classNames('MarkdownInput-input', { 'is-disabled': disabled })}
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={maxLength || null}
        addonAfter={<MarkdownHelp disabled={disabled} inline />}
        />
      {renderCount()}
    </div>
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
        maxLength={maxLength || null}
        />
      <div
        className={classNames(
          'MarkdownInput-blockHelpContainer',
          { 'MarkdownInput-blockHelpContainer--embeddable': embeddable }
        )}
        >
        <MarkdownHelp size={embeddable ? 'small' : 'normal'} disabled={disabled} />
      </div>
      {renderCount()}
    </div>
  );

  const renderInput = () => inline ? renderInlineInput() : renderBlockInput();

  const renderPreview = () => (
    <div className="MarkdownInput-previewContainer">
      <Markdown
        inline={inline}
        className={classNames('MarkdownInput-preview', { 'MarkdownInput-preview--inline': inline })}
        >
        {value}
      </Markdown>
      <Tooltip title={t('previewArea')}>
        <PreviewIcon className="MarkdownInput-previewWatermark" />
      </Tooltip>
    </div>
  );

  return (
    <div className="MarkdownInput">
      {preview ? <InputAndPreview input={renderInput()} preview={renderPreview()} inline /> : renderInput()}
    </div>
  );
}

MarkdownInput.propTypes = {
  maxLength: PropTypes.number,
  disabled: PropTypes.bool,
  embeddable: PropTypes.bool,
  inline: PropTypes.bool,
  minRows: PropTypes.number,
  onChange: PropTypes.func,
  preview: PropTypes.bool,
  value: PropTypes.string
};

MarkdownInput.defaultProps = {
  maxLength: 0,
  disabled: false,
  embeddable: false,
  inline: false,
  minRows: 3,
  onChange: () => '',
  preview: false,
  value: ''
};

export default MarkdownInput;
