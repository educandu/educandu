import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useRef } from 'react';
import Logger from '../common/logger.js';
import { Dropdown, Tooltip } from 'antd';
import AbcNotation from './abc-notation.js';
import reactDropzoneNs from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import InputAndPreview from './input-and-preview.js';
import PreviewIcon from './icons/general/preview-icon.js';
import { handleError, handleWarning } from '../ui/error-helper.js';
import NeverScrollingTextArea from './never-scrolling-text-area.js';
import { ArrowsDownUpIcon, SourceCodeIcon, ToolIcon } from './icons/icons.js';

const ReactDropzone = reactDropzoneNs.default || reactDropzoneNs;

const logger = new Logger(import.meta.url);

const TRANSPOSITION_HALF_STEPS = [6, 5, 4, 3, 2, 1, -1, -2, -3, -4, -5, -6];

function AbcInput({
  value,
  minRows,
  disabled,
  debounced,
  onChange,
  ...rest
}) {
  const dropzoneRef = useRef(null);
  const inputContainerRef = useRef(null);
  const { t } = useTranslation('abcInput');
  const debouncedInputApiRef = useRef(null);

  const replaceValueAndFlush = newValue => {
    const input = inputContainerRef.current.querySelector('textarea');
    input.focus();
    input.setRangeText(newValue, 0, input.value.length, 'end');
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    debouncedInputApiRef.current?.flush();
  };

  const importMusicXml = () => {
    dropzoneRef.current.open();
  };

  const transpose = async halfSteps => {
    try {
      const newValue = (await import('@educandu/abc-tools')).transposeAbc(value, halfSteps);
      replaceValueAndFlush(newValue);
    } catch (error) {
      handleError({ message: error.message, error, logger, t });
    }
  };

  const handleMusixXmlFileSelect = async fs => {
    if (!fs.length) {
      return;
    }

    try {
      const xmlString = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = event => reject(event.target.error);
        reader.readAsText(fs[0]);
      });

      const { result, warningMessage } = (await import('@educandu/abc-tools')).convertMusicXmlToAbc(xmlString);
      replaceValueAndFlush(result);
      if (warningMessage) {
        handleWarning({ message: warningMessage, logger, t });
      }

    } catch (error) {
      handleError({ message: error.message, error, logger, t });
    }
  };

  const handleToolsItemClick = ({ key }) => {
    if (key === 'import-music-xml') {
      importMusicXml();
    } else {
      transpose(Number.parseInt(key.split('|')[1], 10));
    }
  };

  const toolsItems = [
    {
      key: 'import-music-xml',
      label: t('importMusicXmlLabel'),
      icon: <SourceCodeIcon />
    },
    {
      key: 'transpose',
      label: t('transposeLabel'),
      icon: <ArrowsDownUpIcon />,
      disabled: !value,
      children: TRANSPOSITION_HALF_STEPS.map(halfSteps => ({
        key: `transpose-child|${halfSteps}`,
        label: t('transposeChildLabel', {
          halfSteps: Math.abs(halfSteps),
          direction: halfSteps < 0 ? 'down' : 'up'
        })
      }))
    }
  ];

  const renderToolsButton = () => (
    <Dropdown
      placement="top"
      trigger={['click']}
      disabled={disabled}
      arrow={{ pointAtCenter: true }}
      menu={{ items: toolsItems, onClick: handleToolsItemClick }}
      >
      <Tooltip title={t('toolsButtonTooltip')} placement="left">
        <div
          className={classNames({
            'AbcInput-abcToolsButton': true,
            'is-disabled': disabled
          })}
          >
          <ToolIcon />
        </div>
      </Tooltip>
    </Dropdown>
  );

  const renderInput = () => (
    <div className="AbcInput-textareaContainer" ref={inputContainerRef}>
      <NeverScrollingTextArea
        {...rest}
        value={value}
        minRows={minRows}
        disabled={disabled}
        debounced={debounced}
        className="AbcInput-textarea"
        debouncedApiRef={debouncedInputApiRef}
        onChange={onChange}
        />
      <div className="AbcInput-abcToolsContainer">
        {renderToolsButton()}
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="AbcInput-previewContainer">
      <div className="AbcInput-preview">
        <AbcNotation abcCode={value} />
      </div>
      <Tooltip title={t('common:previewArea')}>
        <PreviewIcon className="AbcInput-previewWatermark" />
      </Tooltip>
    </div>
  );

  return (
    <div className="AbcInput">
      <InputAndPreview input={renderInput()} preview={renderPreview()} />
      <ReactDropzone ref={dropzoneRef} onDrop={handleMusixXmlFileSelect} noKeyboard noClick>
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()}>
            <input {...getInputProps()} hidden />
          </div>
        )}
      </ReactDropzone>
    </div>
  );
}

AbcInput.propTypes = {
  disabled: PropTypes.bool,
  debounced: PropTypes.bool,
  minRows: PropTypes.number,
  onChange: PropTypes.func,
  value: PropTypes.string
};

AbcInput.defaultProps = {
  disabled: false,
  debounced: false,
  minRows: 6,
  onChange: () => {},
  value: ''
};

export default AbcInput;
