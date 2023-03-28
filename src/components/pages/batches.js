import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { Table, List, Checkbox } from 'antd';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../locale-context.js';
import { BATCH_TYPE } from '../../domain/constants.js';
import { handleApiError } from '../../ui/error-helper.js';
import React, { Fragment, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import BatchApiClient from '../../api-clients/batch-api-client.js';
import { WarningOutlined, CheckOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import {
  documentValidationBatchDetailsShape,
  documentRegenerationBatchDetailsShape,
  cdnResourcesConsolidationBatchDetailsShape
} from '../../ui/default-prop-types.js';

const POLL_INTERVAL_IN_MS = 500;
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
  const { formatDate } = useDateFormat();
  const { t } = useTranslation('batches');
  const [batch, setBatch] = useState(initialState.batch);
  const [taskTableItems, setTaskTableItems] = useState([]);
  const batchApiClient = useSessionAwareApiClient(BatchApiClient);
  const [overallBatchStatus, setOverallBatchStatus] = useState(null);
  const [hideSuccessfullyCompletedTasks, setHideSuccessfullyCompletedTasks] = useState(true);

  useEffect(() => {
    let errorCount = 0;
    let warningCount = 0;

    const taskItems = [];
    for (const task of batch.tasks) {
      if (!task.processed) {
        taskItems.push({
          ...task,
          status: STATUS.pending,
          localizedStatus: localizeStatus(STATUS.pending, t)
        });
      } else if (task.attempts[task.attempts.length - 1].errors.length) {
        taskItems.push({
          ...task,
          status: STATUS.error,
          localizedStatus: localizeStatus(STATUS.error, t)
        });
        errorCount += 1;
      } else if (task.attempts.some(attempt => attempt.errors.length)) {
        taskItems.push({
          ...task,
          status: STATUS.warning,
          localizedStatus: localizeStatus(STATUS.warning, t)
        });
        warningCount += 1;
      } else if (!hideSuccessfullyCompletedTasks) {
        taskItems.push({
          ...task,
          status: STATUS.success,
          localizedStatus: localizeStatus(STATUS.success, t)
        });
      }
    }

    setTaskTableItems(taskItems);

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
  }, [batch, hideSuccessfullyCompletedTasks, t]);

  useEffect(() => {
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
        handleApiError({ error, logger, t });
      }
    };

    nextTimeout = setTimeout(getUpdate, POLL_INTERVAL_IN_MS);

    return () => {
      if (nextTimeout) {
        clearTimeout(nextTimeout);
      }
    };
  }, [t, batchApiClient, batch._id, batch.progress]);

  const handleHideSuccessfullyCompletedTasksChange = event => {
    setHideSuccessfullyCompletedTasks(event.target.checked);
  };

  const renderTaskStatus = (_, taskItem) => {
    switch (taskItem.status) {
      case STATUS.pending:
        return <span><SyncOutlined spin /> {taskItem.localizedStatus}</span>;
      case STATUS.warning:
        return <span><WarningOutlined className="BatchesPage-warningIcon" /> {taskItem.localizedStatus}</span>;
      case STATUS.error:
        return <span><ExclamationCircleOutlined className="BatchesPage-errorIcon" /> {taskItem.localizedStatus}</span>;
      case STATUS.success:
        return <span><CheckOutlined className="BatchesPage-successIcon" /> {taskItem.localizedStatus}</span>;
      default:
        throw new Error(`Invalid status '${taskItem.status}'`);
    }
  };

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

  const renderDocumentEntityId = taskParams => (
    <a target="_blank" href={routes.getDocUrl({ id: taskParams.documentId })} rel="noreferrer noopener">
      {taskParams.documentId}
    </a>
  );

  const renderCdnResourcesConsolidationEntityId = taskParams => {
    const url = routes.getDocUrl({ id: taskParams.documentId });
    const text = taskParams.documentId;

    return <a target="_blank" href={url} rel="noreferrer noopener">{text}</a>;
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

  const taskTableColumns = [];
  switch (batch.batchType) {
    case BATCH_TYPE.documentValidation:
    case BATCH_TYPE.documentRegeneration:
      taskTableColumns.push({
        title: t('common:document'),
        key: 'taskParamsTypeEntityId',
        dataIndex: 'taskParams',
        render: renderDocumentEntityId
      });
      break;
    case BATCH_TYPE.cdnResourcesConsolidation:
      taskTableColumns.push({
        title: t('common:document'),
        key: 'taskParamsTypeEntityId',
        dataIndex: 'taskParams',
        render: renderCdnResourcesConsolidationEntityId
      });
      taskTableColumns.push({
        title: t('common:type'),
        key: 'taskParamsType',
        dataIndex: 'taskParams',
        render: () => t('common:document')
      });
      break;
    default:
      throw new Error(`Invalid batch type '${batch.batchType}'`);
  }

  taskTableColumns.push({
    title: t('taskStatus'),
    dataIndex: 'localizedStatus',
    render: renderTaskStatus,
    sorter: (a, b) => a.localizedStatus.localeCompare(b.localizedStatus)
  });

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
        <div className="BatchesPage-batchInfo">
          <div>{t('common:status')}: {renderBatchStatus()}</div>
          <div>{t('common:creationDate')}: {renderDate(batch.createdOn)}</div>
          <div>{t('completedOn')}: {renderDate(batch.completedOn)}</div>
          <div>{t('common:user')}: {batch.createdBy.displayName}</div>
        </div>
        {!!batch.errors.length && (
          <List
            className="BatchesPage-batchErrorsList"
            size="small"
            header={t('batchErrors')}
            dataSource={batch.errors}
            renderItem={error => <List.Item>{JSON.stringify(error)}</List.Item>}
            />
        )}
        <h2>{t('tasks')}</h2>
        <div className="BatchesPage-tableFilter">
          <Checkbox
            checked={hideSuccessfullyCompletedTasks}
            onChange={handleHideSuccessfullyCompletedTasksChange}
            >
            {t('hideSuccessfullyCompletedTasks')}
          </Checkbox>
        </div>
        <Table
          size="small"
          bordered
          rowKey="_id"
          dataSource={taskTableItems}
          columns={taskTableColumns}
          pagination={false}
          expandable={{
            expandedRowRender: renderAttemptsSubTable,
            rowExpandable: task => task.attempts?.length
          }}
          />
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
