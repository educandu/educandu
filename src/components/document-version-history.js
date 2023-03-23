import by from 'thenby';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import React, { useState } from 'react';
import routes from '../utils/routes.js';
import { Collapse, Timeline } from 'antd';
import { useTranslation } from 'react-i18next';
import { EyeOutlined } from '@ant-design/icons';
import { useDateFormat } from './locale-context.js';
import { documentRevisionShape } from '../ui/default-prop-types.js';
import { ensureIsExcluded, ensureIsIncluded } from '../utils/array-utils.js';

const { Panel } = Collapse;
const TimelineItem = Timeline.Item;

function DocumentVersionHistory({ documentRevisions }) {
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

  const renderTimelineItemDot = documentRevision => {
    if (idsOfExpandedDocumentRevisions.includes(documentRevision._id)) {
      return (
        <div className="DocumentVersionHistory-timelineItemDot DocumentVersionHistory-timelineItemDot--icon">
          <EyeOutlined />
        </div>
      );
    }
    return (
      <div className="DocumentVersionHistory-timelineItemDot DocumentVersionHistory-timelineItemDot--circle" />
    );
  };

  const renderTimelineItemHeader = documentRevision => {
    const latestVersionText = documentRevision.isLatestVersion ? ` (${t('latest')})` : '';
    const versionText = `${t('version')} ${documentRevision.version}${latestVersionText}`;
    const isPanelOpen = idsOfExpandedDocumentRevisions.includes(documentRevision._id);

    return (
      <span className="DocumentVersionHistory-timelineItemHeader">
        <div className={classNames('DocumentVersionHistory-timelineItemHeaderText', { 'is-panel-open': isPanelOpen })}>
          {versionText}
        </div>
        <div className="DocumentVersionHistory-timelineItemHeaderSubtext">
          {formatDate(documentRevision.createdOn)}
        </div>
      </span>
    );
  };

  const renderTimelineItemContent = documentRevision => {
    const userProfileUrl = routes.getUserProfileUrl(documentRevision.createdBy._id);

    return (
      <div>
        <div className="DocumentVersionHistory-timelineContentRow">
          <div>{t('common:user')}:</div>
          <div className="DocumentVersionHistory-timelineContentRowValue">
            <a className="DocumentVersionHistory-userProfileLink" href={userProfileUrl}>
              {documentRevision.createdBy.displayName}
            </a>
          </div>
        </div>
        <div className="DocumentVersionHistory-timelineContentRow">
          <div>{t('common:id')}:</div>
          <div className="DocumentVersionHistory-timelineContentRowValue">{documentRevision._id}</div>
        </div>
      </div>
    );
  };

  const renderTimelineItem = documentRevision => {
    return (
      <TimelineItem
        key={documentRevision._id}
        dot={renderTimelineItemDot(documentRevision)}
        >
        <div className="DocumentVersionHistory-timelineItem">
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
  documentRevisions: PropTypes.arrayOf(documentRevisionShape).isRequired
};

export default DocumentVersionHistory;
