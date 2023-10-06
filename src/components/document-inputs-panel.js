import by from 'thenby';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import { Collapse, Timeline } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useMemo, useState } from 'react';
import { useDateFormat } from './locale-context.js';
import { getVersionedDocumentRevisions } from '../utils/document-utils.js';
import { ensureIsExcluded, ensureIsIncluded } from '../utils/array-utils.js';
import { documentInputShape, documentRevisionShape } from '../ui/default-prop-types.js';

const { Panel } = Collapse;

function DocumentInputsPanel({ documentInputs, documentRevisions, showUsers }) {
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInputsPanel');
  const sortedDocumentInputs = [...documentInputs].sort(by(x => x.createdOn, 'desc'));

  const [idsOfExpandedDocumentInputs, setIdsOfExpandedDocumentInputs] = useState([]);

  const versionedDocumentRevisions = useMemo(() => getVersionedDocumentRevisions(documentRevisions, t), [documentRevisions, t]);

  const handleCollapseChange = (documentInputId, isOpen) => {
    if (isOpen) {
      setIdsOfExpandedDocumentInputs(ensureIsIncluded(idsOfExpandedDocumentInputs, documentInputId));
    } else {
      setIdsOfExpandedDocumentInputs(ensureIsExcluded(idsOfExpandedDocumentInputs, documentInputId));
    }
  };

  const renderTimelineItemDot = () => {
    return (
      <div className="HistoryPanel-itemDot HistoryPanel-itemDot--circle" />
    );
  };

  const renderTimelineItemHeader = documentInput => {
    const isOpenPanel = idsOfExpandedDocumentInputs.includes(documentInput._id);
    const userProfileUrl = routes.getUserProfileUrl(documentInput.createdBy._id);
    const documentInputIndex = documentInputs.findIndex(input => input._id === documentInput._id);

    return (
      <span className="HistoryPanel-itemHeader">
        <div className={classNames('HistoryPanel-itemHeaderText', { 'is-open-panel': isOpenPanel })}>
          {t('inputNumber', { number: documentInputIndex + 1 })} - {formatDate(documentInput.createdOn)}
        </div>
        {!!showUsers && (
          <div className="HistoryPanel-itemHeaderSubtext">
            <a className="HistoryPanel-itemContentRowValue" href={userProfileUrl}>
              {documentInput.createdBy.displayName}
            </a>
          </div>
        )}
      </span>
    );
  };

  const renderTimelineItemContent = documentInput => {
    const versionedDocumentRevision = versionedDocumentRevisions.find(revision => revision._id === documentInput.documentRevisionId);
    const latestVersionText = versionedDocumentRevision.isLatestVersion ? ` (${t('common:latest')})` : '';

    return (
      <div>
        <div className="HistoryPanel-itemContentRow">
          <div>{t('documentVersion')}: </div>
          <div className="HistoryPanel-itemContentRowValue">
            {versionedDocumentRevision.version} {latestVersionText}
          </div>
        </div>
      </div>
    );
  };

  const getActivityItem = documentInput => {
    return {
      dot: renderTimelineItemDot(documentInput),
      children: (
        <div className="HistoryPanel-item">
          <Collapse
            ghost
            expandIconPosition="end"
            onChange={activeKeys => handleCollapseChange(documentInput._id, !!activeKeys.length)}
            >
            <Panel
              key={documentInput._id}
              header={renderTimelineItemHeader(documentInput)}
              >
              {renderTimelineItemContent(documentInput)}
            </Panel>
          </Collapse>
        </div>
      )
    };
  };

  return (
    <div className="HistoryPanel">
      <Timeline mode="left" items={sortedDocumentInputs.map(getActivityItem)} />
    </div>
  );
}

DocumentInputsPanel.propTypes = {
  documentInputs: PropTypes.arrayOf(documentInputShape).isRequired,
  documentRevisions: PropTypes.arrayOf(documentRevisionShape).isRequired,
  showUsers: PropTypes.bool.isRequired
};

export default DocumentInputsPanel;
