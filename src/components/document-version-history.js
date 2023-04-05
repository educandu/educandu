import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import urlUtils from '../utils/url-utils.js';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { useDateFormat } from './locale-context.js';
import { documentRevisionShape } from '../ui/default-prop-types.js';
import { Button, Collapse, message, Timeline, Tooltip } from 'antd';
import { getVersionedDocumentRevisions } from '../utils/document-utils.js';
import { ensureIsExcluded, ensureIsIncluded } from '../utils/array-utils.js';
import { EyeOutlined, LinkOutlined, SwapOutlined, UndoOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

function DocumentVersionHistory({ documentRevisions, selectedDocumentRevision, canRestore, onViewClick, onRestoreClick }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentVersionHistory');
  const [idsOfExpandedDocumentRevisions, setIdsOfExpandedDocumentRevisions] = useState([]);

  const versionedDocumentRevisions = useMemo(() => getVersionedDocumentRevisions(documentRevisions, t), [documentRevisions, t]);

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

  const handleCompareToLatestButtonClick = documentRevision => {
    const url = routes.getDocumentRevisionComparisonUrl({
      documentId: documentRevision.documentId,
      oldId: documentRevision._id,
      newId: versionedDocumentRevisions[0]._id
    });

    window.open(url, '_blank');
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
    const isOpenPanel = idsOfExpandedDocumentRevisions.includes(documentRevision._id);

    return (
      <span className="DocumentVersionHistory-itemHeader">
        <div className={classNames('DocumentVersionHistory-itemHeaderText', { 'is-open-panel': isOpenPanel })}>
          {documentRevision.versionText}
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
            icon={<LinkOutlined />}
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
        {!documentRevision.isLatestVersion && (
          <Tooltip title={t('compareToLatestTooltip')}>
            <Button
              icon={<SwapOutlined />}
              className="HistoryControlPanel-button"
              disabled={documentRevision.isLatestVersion}
              onClick={() => handleCompareToLatestButtonClick(documentRevision)}
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

  const getActivityItem = documentRevision => {
    return {
      dot: renderTimelineItemDot(documentRevision),
      children: (
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
      )
    };
  };

  return (
    <div className="DocumentVersionHistory">
      <Timeline mode="left" items={versionedDocumentRevisions.map(getActivityItem)} />
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
