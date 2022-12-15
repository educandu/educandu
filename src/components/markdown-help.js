import PropTypes from 'prop-types';
import classNames from 'classnames';
import Markdown from './markdown.js';
import { Modal, Tooltip } from 'antd';
import { Trans, useTranslation } from 'react-i18next';
import MarkdownIcon from './icons/markdown/markdown-icon.js';
import React, { Fragment, useCallback, useState } from 'react';
import { isLetter, splitAroundWords, ZERO_WIDTH_SPACE } from '../utils/string-utils.js';

function MarkdownHelp({ inline, size, disabled }) {
  const { t } = useTranslation('markdownHelp');
  const [isBlockHelpModalOpen, setIsBlockHelpModalOpen] = useState(false);
  const toggleModal = useCallback(() => setIsBlockHelpModalOpen(val => !val), [setIsBlockHelpModalOpen]);

  if (inline) {
    const inlineHelp = (
      <div className={classNames('MarkdownHelp', 'MarkdownHelp--inline', { 'is-disabled': disabled })}>
        <MarkdownIcon />
      </div>
    );

    if (disabled) {
      return inlineHelp;
    }

    const inlineTooltipContent = (
      <div
        className="MarkdownHelp-inlineTooltip"
        dangerouslySetInnerHTML={{ __html: t('inlineTooltipHtml') }}
        />
    );

    return <Tooltip title={inlineTooltipContent}>{inlineHelp}</Tooltip>;
  }

  const blockHelp = (
    <div
      className={classNames('MarkdownHelp', 'MarkdownHelp--block', { 'MarkdownHelp--small': size === 'small', 'is-disabled': disabled })}
      onClick={toggleModal}
      >
      <MarkdownIcon />
    </div>
  );

  if (disabled) {
    return blockHelp;
  }

  const blockTooltipContent = (
    <div className="MarkdownHelp-blockTooltip">
      {t('blockTooltipText')}
    </div>
  );

  const renderMarkdownCode = code => {
    return (
      <Fragment>
        {code.split('\n').map((line, lineIndex) => {
          const tokens = line.split(' ');
          return (
            <Fragment key={lineIndex.toString()}>
              {lineIndex !== 0 && <br />}
              {tokens.map((token, tokenIndex) => (
                <Fragment key={tokenIndex.toString()}>
                  {tokenIndex !== 0 && <span className="MarkdownHelp-spaceIndicator">•</span>}
                  {tokenIndex !== 0 && !!token && ZERO_WIDTH_SPACE}
                  {splitAroundWords(token).map((word, wordIndex) => (
                    <Fragment key={wordIndex.toString()}>
                      {wordIndex !== 0 && isLetter(word) && <wbr />}
                      {word}
                    </Fragment>
                  ))}
                </Fragment>
              ))}
            </Fragment>
          );
        })}
      </Fragment>
    );
  };

  const renderBlockHelp = () => {
    const parts = t('blockHelpMarkdown').replaceAll('<space>', ' ').split('\n\n');
    return (
      <div className="MarkdownHelp-blockHelpContent u-modal-body">
        <table className="MarkdownHelp-blockHelpTable">
          <thead>
            <tr>
              <th className="MarkdownHelp-blockHelpTableHeaderCell">
                <p className="MarkdownHelp-blockHelpTableHeader">{t('blockHelpTableHeaderLeft')}</p>
                <p className="MarkdownHelp-blockHelpTableHeaderAnnotation">
                  <Trans
                    t={t}
                    i18nKey="blockHelpTableHeaderAnnotation"
                    components={[<span key="space-indicator" className="MarkdownHelp-spaceIndicator" />]}
                    />
                </p>
              </th>
              <th className="MarkdownHelp-blockHelpTableHeaderCell">
                <p className="MarkdownHelp-blockHelpTableHeader">{t('blockHelpTableHeaderRight')}</p>
              </th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part, index) => (
              <tr key={index.toString()}>
                <td className="MarkdownHelp-blockHelpTableCell">
                  {renderMarkdownCode(part)}
                </td>
                <td className="MarkdownHelp-blockHelpTableCell">
                  <Markdown>{part}</Markdown>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2" className="MarkdownHelp-blockHelpTableFooterCell">
                <Markdown>{t('blockHelpTableFoot')}</Markdown>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  return (
    <Fragment>
      <Tooltip title={blockTooltipContent} placement="topRight">{blockHelp}</Tooltip>
      <Modal
        width="80%"
        footer={null}
        open={isBlockHelpModalOpen}
        onCancel={toggleModal}
        destroyOnClose
        >
        {renderBlockHelp()}
      </Modal>
    </Fragment>
  );
}

MarkdownHelp.propTypes = {
  disabled: PropTypes.bool,
  inline: PropTypes.bool,
  size: PropTypes.oneOf(['normal', 'small'])
};

MarkdownHelp.defaultProps = {
  disabled: false,
  inline: false,
  size: 'normal'
};

export default MarkdownHelp;
