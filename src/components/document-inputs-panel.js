import by from 'thenby';
import Spinner from './spinner.js';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import routes from '../utils/routes.js';
import EmptyState from './empty-state.js';
import { useUser } from './user-context.js';
import CustomAlert from './custom-alert.js';
import urlUtils from '../utils/url-utils.js';
import { useTranslation } from 'react-i18next';
import EditIcon from './icons/general/edit-icon.js';
import { useDateFormat } from './locale-context.js';
import InputsIcon from './icons/general/inputs-icon.js';
import React, { useEffect, useMemo, useState } from 'react';
import { EyeOutlined, LinkOutlined } from '@ant-design/icons';
import { Button, Collapse, Timeline, Tooltip, message } from 'antd';
import { getVersionedDocumentRevisions } from '../utils/document-utils.js';
import { documentInputShape, documentRevisionShape } from '../ui/default-prop-types.js';

const { Panel } = Collapse;

const PENDING_ITEM_KEY = 'pending';

function DocumentInputsPanel({ loading, hasPendingInputChanges, inputSubmittingDisabled, documentInputs, selectedDocumentInputId, documentRevisions, showUsers, onViewClick }) {
  const user = useUser();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('documentInputsPanel');

  const [expandedKeys, setExpandedKeys] = useState([]);

  const timelineEntries = useMemo(() => {
    const versionedDocumentRevisions = getVersionedDocumentRevisions(documentRevisions, t);

    const entries = documentInputs.sort(by(x => x.createdOn)).map((input, index) => ({
      _id: input._id,
      key: input._id,
      displayNumber: index + 1,
      createdOn: input.createdOn,
      createdBy: input.createdBy,
      versionedDocumentRevision: versionedDocumentRevisions.find(revision => revision._id === input.documentRevisionId),
      permalinkUrl: urlUtils.createFullyQualifiedUrl(routes.getDocumentInputUrl(input._id)),
      isPending: false
    }));

    if (hasPendingInputChanges && !inputSubmittingDisabled) {
      entries.unshift({
        _id: null,
        key: PENDING_ITEM_KEY,
        displayNumber: null,
        createdOn: null,
        createdBy: user,
        versionedDocumentRevision: versionedDocumentRevisions.find(revision => revision.isLatestVersion),
        permalinkUrl: null,
        isPending: true
      });
    }

    return entries.sort(by(x => x.isPending, 'desc').thenBy(x => x.createdOn, 'desc'));
  }, [documentInputs, documentRevisions, hasPendingInputChanges, inputSubmittingDisabled, t, user]);

  useEffect(() => {
    const possibleKeys = new Set(timelineEntries.map(entry => entry.key));
    setExpandedKeys(oldKeys => [PENDING_ITEM_KEY, ...oldKeys].filter(key => possibleKeys.has(key)));
  }, [timelineEntries]);

  const handlePermalinkButtonClick = async entry => {
    try {
      await window.navigator.clipboard.writeText(entry.permalinkUrl);
      message.success(t('common:permalinkCopied'));
    } catch (error) {
      const msg = (
        <span>
          <span>{t('common:permalinkCouldNotBeCopied')}:</span>
          <br />
          <a href={entry.permalinkUrl}>{entry.permalinkUrl}</a>
        </span>
      );
      message.error(msg, 10);
    }
  };

  const renderTimelineItemDot = entry => {
    if (entry.isPending) {
      return (
        <div className="HistoryPanel-itemDot HistoryPanel-itemDot--icon">
          <EditIcon />
        </div>
      );
    }

    if (entry._id === selectedDocumentInputId) {
      return (
        <div className="HistoryPanel-itemDot HistoryPanel-itemDot--icon">
          <EyeOutlined />
        </div>
      );
    }

    return (
      <div className="HistoryPanel-itemDot HistoryPanel-itemDot--circle" />
    );
  };

  const renderTimelineItemHeader = entry => {
    const isOpenPanel = expandedKeys.includes(entry.key);
    const userProfileUrl = routes.getUserProfileUrl(entry.createdBy._id);

    const headerText = entry.isPending
      ? t('pendingInputHeader')
      : t('existingInputHeader', { number: entry.displayNumber, date: formatDate(entry.createdOn) });

    return (
      <span className="HistoryPanel-itemHeader">
        <div className={classNames('HistoryPanel-itemHeaderText', { 'is-open-panel': isOpenPanel })}>
          {headerText}
        </div>
        {!!showUsers && (
          <div className="HistoryPanel-itemHeaderSubtext">
            <a className="HistoryPanel-itemContentRowValue" href={userProfileUrl}>
              {entry.createdBy.displayName}
            </a>
          </div>
        )}
      </span>
    );
  };

  const renderTimelineItemActions = entry => {
    if (entry.isPending) {
      return (
        <div className="HistoryPanel-itemInfo">{t('pendingInfoText')}</div>
      );
    }

    return (
      <div className="HistoryPanel-itemActions">
        <Tooltip title={t('common:permalinkButtonTooltip')}>
          <Button
            icon={<LinkOutlined />}
            onClick={() => handlePermalinkButtonClick(entry)}
            />
        </Tooltip>
        <Tooltip title={t('viewButtonTooltip')}>
          <Button
            icon={<EyeOutlined />}
            disabled={hasPendingInputChanges}
            onClick={() => onViewClick(entry._id)}
            />
        </Tooltip>
      </div>
    );
  };

  const renderTimelineItemContent = entry => {
    const latestVersionText = entry.versionedDocumentRevision.isLatestVersion ? ` (${t('common:latest')})` : '';

    return (
      <div>
        <div className="HistoryPanel-itemContentRow">
          <div>{t('documentVersion')}: </div>
          <div className="HistoryPanel-itemContentRowValue">
            {entry.versionedDocumentRevision.version} {latestVersionText}
          </div>
        </div>
        {renderTimelineItemActions(entry)}
      </div>
    );
  };

  const getActivityItem = entry => {
    return {
      dot: renderTimelineItemDot(entry),
      children: (
        <div className="HistoryPanel-item">
          <Collapse
            ghost
            expandIconPosition="end"
            activeKey={expandedKeys}
            onChange={setExpandedKeys}
            >
            <Panel
              key={entry.key}
              showArrow={!entry.isPending}
              collapsible={entry.isPending ? 'icon' : 'header'}
              header={renderTimelineItemHeader(entry)}
              >
              {renderTimelineItemContent(entry)}
            </Panel>
          </Collapse>
        </div>
      )
    };
  };

  return (
    <div className="HistoryPanel">
      {!!inputSubmittingDisabled && (
        <CustomAlert message={t('inputSubmittingDisabledAlert')} type="error" />
      )}
      {!!loading && <Spinner />}
      {!loading && !timelineEntries.length && (
        <EmptyState
          icon={<InputsIcon />}
          title={t('emptyStateTitle')}
          subtitle={t(inputSubmittingDisabled ? 'emptyStateSubtitleDisabled' : 'emptyStateSubtitle')}
          />
      )}
      {!loading && !!timelineEntries.length && (
        <Timeline mode="left" items={timelineEntries.map(getActivityItem)} />
      )}
    </div>
  );
}

DocumentInputsPanel.propTypes = {
  loading: PropTypes.bool.isRequired,
  hasPendingInputChanges: PropTypes.bool.isRequired,
  inputSubmittingDisabled: PropTypes.bool.isRequired,
  documentInputs: PropTypes.arrayOf(documentInputShape).isRequired,
  selectedDocumentInputId: PropTypes.string,
  documentRevisions: PropTypes.arrayOf(documentRevisionShape).isRequired,
  showUsers: PropTypes.bool.isRequired,
  onViewClick: PropTypes.func.isRequired
};

DocumentInputsPanel.defaultProps = {
  selectedDocumentInputId: null
};

export default DocumentInputsPanel;
