import PropTypes from 'prop-types';
import { Table, List } from 'antd';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { useIsMounted } from '../../ui/hooks.js';
import { useDateFormat } from '../locale-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import React, { Fragment, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import BatchApiClient from '../../api-clients/batch-api-client.js';
import { WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { BATCH_TYPE, CDN_RESOURCES_CONSOLIDATION_TYPE } from '../../domain/constants.js';
import {
  documentValidationBatchDetailsShape,
  documentRegenerationBatchDetailsShape,
  cdnResourcesConsolidationBatchDetailsShape
} from '../../ui/default-prop-types.js';

const MAX_ERROR_COUNT = 3;
const POLL_INTERVAL_IN_MS = 2000;
const POLL_ERROR_INTERVAL_IN_MS = 10000;
const logger = new Logger(import.meta.url);

export const STATUS = {
  pending: 'pending',
  success: 'success',
  warning: 'warning',
  error: 'error'
};

const localizeStatus = (status, t) => {
  switch (status) {
    case STATUS.pending:
      return t('status_pending');
    case STATUS.success:
      return t('status_success');
    case STATUS.warning:
      return t('status_warning');
    case STATUS.error:
      return t('status_error');
    default:
      throw new Error(`Invalid status '${status}'`);
  }
};

function Batches({ initialState, PageTemplate }) {
  const isMounted = useIsMounted();
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('batches');
  const batchApiClient = useSessionAwareApiClient(BatchApiClient);

  const [batch, setBatch] = useState(initialState.batch);
  const [overallBatchStatus, setOverallBatchStatus] = useState(null);
  const [taskErrorAndWarningTableItems, setTaskErrorAndWarningTableItems] = useState([]);

  useEffect(() => {
    let errorCount = 0;
    let warningCount = 0;

    const taskItems = [];
    for (const task of batch.tasks) {
      if (task.processed && task.attempts[task.attempts.length - 1].errors.length) {
        taskItems.push({
          ...task,
          status: STATUS.error,
          localizedStatus: localizeStatus(STATUS.error, t)
        });
        errorCount += 1;
      } else if (task.processed && task.attempts.some(attempt => attempt.errors.length)) {
        taskItems.push({
          ...task,
          status: STATUS.warning,
          localizedStatus: localizeStatus(STATUS.warning, t)
        });
        warningCount += 1;
      }
    }

    setTaskErrorAndWarningTableItems(taskItems);

    let batchStatus;
    if (batch.progress < 1) {
      batchStatus = STATUS.pending;
    } else if (errorCount) {
      batchStatus = STATUS.error;
    } else if (warningCount) {
      batchStatus = STATUS.warning;
    } else {
      batchStatus = STATUS.success;
    }

    setOverallBatchStatus(batchStatus);
  }, [batch, t]);

  useEffect(() => {
    let errorCount = 0;
    let nextTimeout = null;

    const getUpdate = async () => {
      if (batch.progress === 1) {
        return;
      }

      try {
        const updatedBatchDetails = await batchApiClient.getBatch(batch._id);
        setBatch(updatedBatchDetails.batch);
        nextTimeout = setTimeout(getUpdate, POLL_INTERVAL_IN_MS);
      } catch (error) {
        errorCount += 1;
        if (nextTimeout) {
          clearTimeout(nextTimeout);
          nextTimeout = null;
        }
        if (errorCount > MAX_ERROR_COUNT) {
          handleApiError({ error, logger, t });
        } else {
          nextTimeout = setTimeout(getUpdate, POLL_ERROR_INTERVAL_IN_MS);
        }
      }
    };

    nextTimeout = setTimeout(getUpdate, POLL_INTERVAL_IN_MS);

    return () => {
      if (nextTimeout) {
        clearTimeout(nextTimeout);
        nextTimeout = null;
      }
    };
  }, [t, batchApiClient, batch._id, batch.progress]);

  const renderBatchType = batchType => {
    switch (batchType) {
      case BATCH_TYPE.documentValidation:
        return t('batchTypeDocumentValidation');
      case BATCH_TYPE.documentRegeneration:
        return t('batchTypeDocumentRegeneration');
      case BATCH_TYPE.cdnResourcesConsolidation:
        return t('batchTypeCdnResourcesConsolidation');
      default:
        throw new Error(`Invalid batch type '${batchType}'`);
    }
  };

  const renderBatchStatus = () => {
    if (!overallBatchStatus) {
      return null;
    }

    let statusClasses;
    let statusMessage;
    switch (overallBatchStatus) {
      case STATUS.pending:
        statusClasses = 'BatchesPage-status BatchesPage-status--pending';
        statusMessage = batch.progress % 1 !== 0
          ? t('progressMessage', { progress: batch.progress })
          : localizeStatus(STATUS.pending, t);
        break;
      case STATUS.warning:
        statusClasses = 'BatchesPage-status BatchesPage-status--warning';
        statusMessage = localizeStatus(STATUS.warning, t);
        break;
      case STATUS.error:
        statusClasses = 'BatchesPage-status BatchesPage-status--error';
        statusMessage = localizeStatus(STATUS.error, t);
        break;
      case STATUS.success:
        statusClasses = 'BatchesPage-status BatchesPage-status--success';
        statusMessage = localizeStatus(STATUS.success, t);
        break;
      default:
        throw new Error(`Invalid status '${overallBatchStatus}'`);
    }

    return <span className={statusClasses}>{statusMessage}</span>;
  };

  const renderDate = date => formatDate(date);

  const renderEntityId = (_, taskItem) => {
    const { taskParams } = taskItem;

    if (batch.batchType !== BATCH_TYPE.cdnResourcesConsolidation) {
      return (
        <a target="_blank" href={routes.getDocUrl({ id: taskParams.documentId })} rel="noreferrer noopener">
          {taskParams.documentId}
        </a>
      );
    }

    let url;
    switch (taskParams.type) {
      case CDN_RESOURCES_CONSOLIDATION_TYPE.document:
        url = routes.getDocUrl({ id: taskParams.entityId });
        break;
      case CDN_RESOURCES_CONSOLIDATION_TYPE.documentCategory:
        url = routes.getDocumentCategoryUrl({ id: taskParams.entityId });
        break;
      case CDN_RESOURCES_CONSOLIDATION_TYPE.room:
        url = null;
        break;
      case CDN_RESOURCES_CONSOLIDATION_TYPE.user:
        url = routes.getUserProfileUrl(taskParams.entityId);
        break;
      case CDN_RESOURCES_CONSOLIDATION_TYPE.setting:
        url = routes.getAdminUrl();
        break;
      default:
        throw new Error(`Invalid CDN resources consolidation type '${taskParams.type}`);
    }

    return url
      ? <a target="_blank" href={url} rel="noreferrer noopener">{taskParams.entityId}</a>
      : <span>{taskParams.entityId}</span>;
  };

  const renderEntityType = (_, taskItem) => {
    const { taskParams } = taskItem;

    if (batch.batchType !== BATCH_TYPE.cdnResourcesConsolidation) {
      return t('common:document');
    }

    switch (taskParams.type) {
      case CDN_RESOURCES_CONSOLIDATION_TYPE.document:
        return t('common:document');
      case CDN_RESOURCES_CONSOLIDATION_TYPE.documentCategory:
        return t('documentCategory');
      case CDN_RESOURCES_CONSOLIDATION_TYPE.room:
        return t('common:room');
      case CDN_RESOURCES_CONSOLIDATION_TYPE.user:
        return t('common:user');
      case CDN_RESOURCES_CONSOLIDATION_TYPE.setting:
        return t('common:setting');
      default:
        throw new Error(`Invalid CDN resources consolidation type '${taskParams.type}`);
    }
  };

  const renderTaskStatus = (_, taskItem) => {
    switch (taskItem.status) {
      case STATUS.warning:
        return <span><WarningOutlined className="BatchesPage-warningIcon" /> {taskItem.localizedStatus}</span>;
      case STATUS.error:
        return <span><ExclamationCircleOutlined className="BatchesPage-errorIcon" /> {taskItem.localizedStatus}</span>;
      default:
        throw new Error(`Invalid status '${taskItem.status}'`);
    }
  };

  const renderErrorCount = attempt => <span>{attempt.errors?.length || 0} {t('errors')}</span>;

  const renderErrors = attempt => (
    <List
      dataSource={attempt.errors.map(JSON.stringify)}
      renderItem={error => <List.Item>{error}</List.Item>}
      />
  );

  const attemtpsTableColumns = [
    { title: t('startedOn'), dataIndex: 'startedOn', width: '50px', render: renderDate },
    { title: t('completedOn'), dataIndex: 'completedOn', width: '150px', render: renderDate },
    { title: t('errorsCount'), width: '150px', render: renderErrorCount }
  ];

  const renderAttemptsSubTable = task => (
    <Table
      key={task._id}
      rowKey={attempt => `${task._id}_${attempt.startedOn}}`}
      dataSource={task.attempts}
      columns={attemtpsTableColumns}
      pagination={false}
      expandable={{
        rowExpandable: attempt => attempt.errors?.length,
        expandedRowRender: attempt => renderErrors(attempt)
      }}
      />
  );

  const taskTableColumns = [
    {
      title: t('common:id'),
      key: 'entityId',
      dataIndex: 'taskParams',
      render: renderEntityId
    },
    {
      title: t('common:type'),
      key: 'entityType',
      dataIndex: 'taskParams',
      render: renderEntityType
    },
    {
      title: t('taskStatus'),
      dataIndex: 'localizedStatus',
      render: renderTaskStatus
    }
  ];

  const batchInfos = [<span key="batch-type">{t('batchType')}: {renderBatchType(batch.batchType)}</span>];

  return (
    <PageTemplate>
      <div className="BatchesPage">
        <h1>{t('pageNames:batches')}</h1>
        <div className="BatchesPage-batchInfo">
          {batchInfos.map((info, index) => (
            <Fragment key={index.toString()}>
              {index !== 0 && <span> | </span>}
              {info}
            </Fragment>
          ))}
        </div>
        {!!isMounted.current && (
          <div className="BatchesPage-batchInfo">
            <div>{t('common:status')}: {renderBatchStatus()}</div>
            <div>{t('common:creationDate')}: {renderDate(batch.createdOn)}</div>
            <div>{t('completedOn')}: {renderDate(batch.completedOn)}</div>
            <div>{t('common:user')}: {batch.createdBy.displayName}</div>
          </div>
        )}
        {!!batch.errors.length && (
          <List
            className="BatchesPage-batchErrorsList"
            size="small"
            header={t('batchErrors')}
            dataSource={batch.errors}
            renderItem={error => <List.Item>{JSON.stringify(error)}</List.Item>}
            />
        )}
        <h3>{t('taskErrorsAndWarnings')}</h3>
        {!!taskErrorAndWarningTableItems.length && (
          <Table
            size="small"
            bordered
            rowKey="_id"
            dataSource={taskErrorAndWarningTableItems}
            columns={taskTableColumns}
            pagination={false}
            showSorterTooltip={false}
            expandable={{
              expandedRowRender: renderAttemptsSubTable,
              rowExpandable: task => task.attempts?.length
            }}
            />
        )}
        {!taskErrorAndWarningTableItems.length && (
          <div>
            {t('noTaskErrorsOrWarnings')}
          </div>
        )}
      </div>
    </PageTemplate>
  );
}

Batches.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    batch: PropTypes.oneOfType([
      documentValidationBatchDetailsShape,
      documentRegenerationBatchDetailsShape,
      cdnResourcesConsolidationBatchDetailsShape
    ]).isRequired
  }).isRequired
};

export default Batches;
