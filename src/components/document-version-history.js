import by from 'thenby';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from './locale-context.js';
import { documentRevisionShape } from '../ui/default-prop-types.js';
import { Button, Collapse, message, Timeline, Tooltip } from 'antd';
import { ensureIsExcluded, ensureIsIncluded } from '../utils/array-utils.js';
import { EyeOutlined, PaperClipOutlined, UndoOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const TimelineItem = Timeline.Item;

function DocumentVersionHistory({ documentRevisions, selectedDocumentRevision, canRestore, onViewClick, onRestoreClick }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentVersionHistory');
  const [idsOfExpandedDocumentRevisions, setIdsOfExpandedDocumentRevisions] = useState([]);

  const mappedDocumentRevisions = documentRevisions
    .sort(by(r => r.createdOn, 'desc'))
    .map((revision, index) => {
      return {
        ...revision,
        version: documentRevisions.length - index,
        isLatestVersion: index === 0
      };
    });

  const handleCollapseChange = (documentRevisionId, isOpen) => {
    if (isOpen) {
      setIdsOfExpandedDocumentRevisions(ensureIsIncluded(idsOfExpandedDocumentRevisions, documentRevisionId));
    } else {
      setIdsOfExpandedDocumentRevisions(ensureIsExcluded(idsOfExpandedDocumentRevisions, documentRevisionId));
    }
  };

  const handlePermalinkButtonClick = async documentRevision => {
    const permalinkUrl = urlUtils.createFullyQualifiedUrl(routes.getDocumentRevisionUrl(documentRevision._id));
    try {
      await window.navigator.clipboard.writeText(permalinkUrl);
      message.success(t('permalinkCopied'));
    } catch (error) {
      const msg = (
        <span>
          <span>{t('permalinkCouldNotBeCopied')}:</span>
          <br />
          <a href={permalinkUrl}>{permalinkUrl}</a>
        </span>
      );
      message.error(msg, 10);
    }
  };

  const handleRestoreButtonClick = documentRevision => {
    onRestoreClick({ documentRevisionId: documentRevision._id, documentId: documentRevision.documentId });
  };

  const renderTimelineItemDot = documentRevision => {
    const isSelectedDocumentRevision = selectedDocumentRevision?._id === documentRevision._id;

    if (isSelectedDocumentRevision) {
      return (
        <div className="DocumentVersionHistory-itemDot DocumentVersionHistory-itemDot--icon">
          <EyeOutlined />
        </div>
      );
    }

    return (
      <div className="DocumentVersionHistory-itemDot DocumentVersionHistory-itemDot--circle" />
    );
  };

  const renderTimelineItemHeader = documentRevision => {
    const latestVersionText = documentRevision.isLatestVersion ? ` (${t('latest')})` : '';
    const versionText = `${t('version')} ${documentRevision.version}${latestVersionText}`;
    const isOpenPanel = idsOfExpandedDocumentRevisions.includes(documentRevision._id);

    return (
      <span className="DocumentVersionHistory-itemHeader">
        <div className={classNames('DocumentVersionHistory-itemHeaderText', { 'is-open-panel': isOpenPanel })}>
          {versionText}
        </div>
        <div className="DocumentVersionHistory-itemHeaderSubtext">
          {formatDate(documentRevision.createdOn)}
        </div>
      </span>
    );
  };

  const renderTimelineItemActions = documentRevision => {
    return (
      <div className="DocumentVersionHistory-itemActions">
        <Tooltip title={t('permalinkButtonTooltip')}>
          <Button
            icon={<PaperClipOutlined />}
            className="HistoryControlPanel-button"
            onClick={() => handlePermalinkButtonClick(documentRevision)}
            />
        </Tooltip>
        {!!canRestore && (
          <Tooltip title={t('restoreButtonToltip')}>
            <Button
              icon={<UndoOutlined />}
              className="HistoryControlPanel-button"
              disabled={documentRevision.isLatestVersion}
              onClick={() => handleRestoreButtonClick(documentRevision)}
              />
          </Tooltip>
        )}
        <Tooltip title={t('viewButtonTooltip')}>
          <Button
            icon={<EyeOutlined />}
            className="HistoryControlPanel-button"
            onClick={() => onViewClick(documentRevision._id)}
            />
        </Tooltip>
      </div>
    );
  };

  const renderTimelineItemContent = documentRevision => {
    const userProfileUrl = routes.getUserProfileUrl(documentRevision.createdBy._id);

    return (
      <div>
        <div className="DocumentVersionHistory-itemContentRow">
          <div>{t('common:user')}:</div>
          <a className="DocumentVersionHistory-itemContentRowValue" href={userProfileUrl}>
            {documentRevision.createdBy.displayName}
          </a>
        </div>
        <div className="DocumentVersionHistory-itemContentRow">
          <div>{t('common:id')}:</div>
          <div className="DocumentVersionHistory-itemContentRowValue">{documentRevision._id}</div>
        </div>
        {renderTimelineItemActions(documentRevision)}
      </div>
    );
  };

  const renderTimelineItem = documentRevision => {
    return (
      <TimelineItem
        key={documentRevision._id}
        dot={renderTimelineItemDot(documentRevision)}
        >
        <div className="DocumentVersionHistory-item">
          <Collapse
            ghost
            expandIconPosition="end"
            onChange={activeKeys => handleCollapseChange(documentRevision._id, !!activeKeys.length)}
            >
            <Panel
              key={documentRevision._id}
              header={renderTimelineItemHeader(documentRevision)}
              >
              {renderTimelineItemContent(documentRevision)}
            </Panel>
          </Collapse>
        </div>
      </TimelineItem>
    );
  };

  return (
    <div className="DocumentVersionHistory">
      <Timeline mode="left">
        {mappedDocumentRevisions.map(renderTimelineItem)}
      </Timeline>
    </div>
  );
}

DocumentVersionHistory.propTypes = {
  documentRevisions: PropTypes.arrayOf(documentRevisionShape).isRequired,
  selectedDocumentRevision: documentRevisionShape,
  canRestore: PropTypes.bool.isRequired,
  onViewClick: PropTypes.func.isRequired,
  onRestoreClick: PropTypes.func.isRequired
};

DocumentVersionHistory.defaultProps = {
  selectedDocumentRevision: null
};

export default DocumentVersionHistory;
