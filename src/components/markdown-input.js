import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { Input, Tooltip } from 'antd';
import MarkdownHelp from './markdown-help.js';
import { useTranslation } from 'react-i18next';
import { LinkOutlined } from '@ant-design/icons';
import { useStorage } from './storage-context.js';
import InputAndPreview from './input-and-preview.js';
import PreviewIcon from './icons/general/preview-icon.js';
import React, { useEffect, useRef, useState } from 'react';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import ResourcePickerDialog from './resource-picker/resource-picker-dialog.js';

const URL_INSERT_EVENT = 'urlInsert';

function MarkdownInput({ minRows, disabled, inline, renderAnchors, value, onChange, preview, embeddable, maxLength, ...rest }) {
  const { locations } = useStorage();
  const { t } = useTranslation('markdownInput');
  const [currentCaretPosition, setCurrentCaretPosition] = useState(-1);

  const blockInputContainerRef = useRef(null);
  const [isResourcePickerOpen, setIsResourcePickerOpen] = useState(false);

  useEffect(() => {
    if (blockInputContainerRef?.current) {
      const currentTextArea = blockInputContainerRef.current;
      currentTextArea.addEventListener(URL_INSERT_EVENT, onChange);
      return () => {
        if (currentTextArea) {
          currentTextArea.removeEventListener(URL_INSERT_EVENT, onChange);
        }
      };
    }
    return () => {};
  }, [blockInputContainerRef, onChange]);

  const renderCount = () => !!maxLength
    && <div className="MarkdownInput-count">{value.length} / {maxLength}</div>;

  const handleResourcePickerClick = () => {
    if (disabled) {
      return;
    }
    setIsResourcePickerOpen(true);
  };

  const handleResourcePickerUrlSelect = url => {
    const caretPosition = currentCaretPosition > -1 ? currentCaretPosition : value.length;
    const valueBeforeCaret = value.substr(0, caretPosition);
    const valueAfterCaret = value.substr(caretPosition);
    const urlMarkdown = `![](${url})`;

    blockInputContainerRef.current.value = `${valueBeforeCaret}${urlMarkdown}${valueAfterCaret}`;
    blockInputContainerRef.current.dispatchEvent(new Event(URL_INSERT_EVENT));

    setIsResourcePickerOpen(false);
  };

  const handleResourcePickerClose = () => {
    setIsResourcePickerOpen(false);
  };

  const handleChange = event => {
    setCurrentCaretPosition(event.target.selectionStart);
    onChange(event);
  };

  const handleClick = event => {
    setCurrentCaretPosition(event.target.selectionStart);
  };

  const renderInlineInput = () => (
    <div className="MarkdownInput-inlineInputContainer">
      <Input
        {...rest}
        className={classNames('MarkdownInput-input', { 'is-disabled': disabled })}
        value={value}
        onClick={handleClick}
        onChange={handleChange}
        disabled={disabled}
        maxLength={maxLength || null}
        addonAfter={<MarkdownHelp disabled={disabled} inline />}
        />
      {renderCount()}
    </div>
  );

  const renderResourcePicker = () => {
    return (
      <div
        onClick={handleResourcePickerClick}
        className={classNames({
          'MarkdownInput-resourcePicker': true,
          'MarkdownInput-resourcePicker--small': embeddable,
          'is-disabled': disabled
        })}
        >
        <LinkOutlined />
        <ResourcePickerDialog
          isOpen={isResourcePickerOpen}
          onSelect={handleResourcePickerUrlSelect}
          onClose={handleResourcePickerClose}
          />
      </div>
    );
  };

  const renderBlockInput = () => (
    <div className="MarkdownInput-textareaContainer" ref={blockInputContainerRef}>
      <NeverScrollingTextArea
        {...rest}
        className="MarkdownInput-textarea"
        value={value}
        onChange={handleChange}
        onClick={handleClick}
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
        {!!locations.length && !disabled
          && (<Tooltip title={t('resourcePickerTooltip')}>{renderResourcePicker()}</Tooltip>)}
        {!!locations.length && !!disabled && renderResourcePicker()}
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
        renderAnchors={renderAnchors}
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
  disabled: PropTypes.bool,
  embeddable: PropTypes.bool,
  inline: PropTypes.bool,
  maxLength: PropTypes.number,
  minRows: PropTypes.number,
  onChange: PropTypes.func,
  preview: PropTypes.bool,
  renderAnchors: PropTypes.bool,
  value: PropTypes.string
};

MarkdownInput.defaultProps = {
  disabled: false,
  embeddable: false,
  inline: false,
  maxLength: 0,
  minRows: 3,
  onChange: () => {},
  preview: false,
  renderAnchors: false,
  value: ''
};

export default MarkdownInput;
