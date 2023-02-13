import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { Input, Tooltip } from 'antd';
import MarkdownHelp from './markdown-help.js';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import { LinkOutlined } from '@ant-design/icons';
import DebouncedInput from './debounced-input.js';
import { useStorage } from './storage-context.js';
import { useService } from './container-context.js';
import InputAndPreview from './input-and-preview.js';
import ClientConfig from '../bootstrap/client-config.js';
import PreviewIcon from './icons/general/preview-icon.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import GithubFlavoredMarkdown from '../common/github-flavored-markdown.js';
import ResourceSelectorDialog from './resource-selector/resource-selector-dialog.js';

function MarkdownInput({ minRows, disabled, inline, debounced, renderAnchors, sanitizeCdnUrls, value, onBlur, onChange, preview, embeddable, maxLength, ...rest }) {
  const { locations } = useStorage();
  const inputContainerRef = useRef(null);
  const debouncedInputApiRef = useRef(null);
  const { t } = useTranslation('markdownInput');
  const clientConfig = useService(ClientConfig);
  const gfm = useService(GithubFlavoredMarkdown);
  const [isResourceSelectorDialogOpen, setIsResourceSelectorDialogOpen] = useState(false);

  const insertText = ({ text, replaceAll = false, focus = false }) => {
    const input = inputContainerRef.current.querySelector(inline ? 'input[type=text]' : 'textarea');
    if (focus) {
      input.focus();
    }

    const selectionStart = replaceAll ? 0 : input.selectionStart;
    const selectionEnd = replaceAll ? input.value.length : input.selectionEnd;
    const selectionMode = replaceAll ? 'end' : 'select';

    input.setRangeText(text, selectionStart, selectionEnd, selectionMode);
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    debouncedInputApiRef.current?.flush();
  };

  const renderCount = () => !!maxLength && <div className="u-input-count">{value.length} / {maxLength}</div>;

  const handleOpenResourceSelectorClick = () => {
    if (!disabled) {
      setIsResourceSelectorDialogOpen(true);
    }
  };

  const handleResourceSelectorDialogSelect = url => {
    setIsResourceSelectorDialogOpen(false);
    setTimeout(() => insertText({ text: `![](${url})`, focus: true }), 500);
  };

  const handleResourceSelectorDialogClose = () => {
    setIsResourceSelectorDialogOpen(false);
  };

  const handleBlur = event => {
    const sanitizedValue = gfm.makeCdnResourcesPortable(value, clientConfig.cdnRootUrl);
    if (value !== sanitizedValue) {
      insertText({ text: sanitizedValue, replaceAll: true });
    }
    onBlur(event);
  };

  const renderInlineInput = () => {
    const inputProps = {
      ...rest,
      value,
      disabled,
      maxLength: maxLength || null,
      addonAfter: <MarkdownHelp disabled={disabled} inline />,
      className: classNames('MarkdownInput-input', { 'is-disabled': disabled }),
      onBlur: handleBlur,
      onChange
    };
    return (
      <div className="MarkdownInput-inlineInputContainer" ref={inputContainerRef}>
        {!debounced && <Input {...inputProps} />}
        {!!debounced && <DebouncedInput apiRef={debouncedInputApiRef} {...inputProps} elementType={Input} />}
        {renderCount()}
      </div>
    );
  };

  const renderResourceSelector = () => {
    return (
      <div
        onClick={handleOpenResourceSelectorClick}
        className={classNames({
          'MarkdownInput-resourceSelector': true,
          'MarkdownInput-resourceSelector--small': embeddable,
          'is-disabled': disabled
        })}
        >
        <LinkOutlined />
        <ResourceSelectorDialog
          isOpen={isResourceSelectorDialogOpen}
          onSelect={handleResourceSelectorDialogSelect}
          onClose={handleResourceSelectorDialogClose}
          />
      </div>
    );
  };

  const renderBlockInput = () => (
    <div className="MarkdownInput-textareaContainer" ref={inputContainerRef}>
      <NeverScrollingTextArea
        {...rest}
        className="MarkdownInput-textarea"
        value={value}
        debounced={debounced}
        debouncedApiRef={debouncedInputApiRef}
        onChange={onChange}
        onBlur={handleBlur}
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
          && (<Tooltip title={t('resourceSelectorTooltip')}>{renderResourceSelector()}</Tooltip>)}
        {!!locations.length && !!disabled && renderResourceSelector()}
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
  debounced: PropTypes.bool,
  maxLength: PropTypes.number,
  minRows: PropTypes.number,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  preview: PropTypes.bool,
  renderAnchors: PropTypes.bool,
  sanitizeCdnUrls: PropTypes.bool,
  value: PropTypes.string
};

MarkdownInput.defaultProps = {
  disabled: false,
  embeddable: false,
  inline: false,
  debounced: false,
  maxLength: 0,
  minRows: 3,
  onBlur: () => {},
  onChange: () => {},
  preview: false,
  renderAnchors: false,
  sanitizeCdnUrls: true,
  value: ''
};

export default MarkdownInput;
