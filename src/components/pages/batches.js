import PropTypes from 'prop-types';
import { Table, List } from 'antd';
import urls from '../../utils/routes.js';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import ImportTypeIcon from '../import-type-icon.js';
import { useDateFormat } from '../locale-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import React, { Fragment, useEffect, useState } from 'react';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import BatchApiClient from '../../api-clients/batch-api-client.js';
import { isTaskSuccessful, taskStatusSorter, doesTaskHaveErrors } from '../../utils/task-utils.js';
import { WarningOutlined, CheckOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';
import {
  BATCH_TYPE,
  CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE
} from '../../domain/constants.js';
import {
  documentImportBatchDetailsShape,
  documentRegenerationBatchDetailsShape,
  cdnResourcesConsolidationBatchDetailsShape,
  cdnUploadDirectoryCreationBatchDetailsShape
} from '../../ui/default-prop-types.js';

const POLL_INTERVAL_IN_MS = 500;
const logger = new Logger(import.meta.url);

function Batches({ initialState, PageTemplate }) {
  const { t } = useTranslation('batches');
  const { formatDate } = useDateFormat();
  const [batch, setBatch] = useState(initialState.batch);
  const batchApiClient = useSessionAwareApiClient(BatchApiClient);

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

  const renderTaskStatus = (processed, task) => {
    if (!processed) {
      return <span><SyncOutlined spin /> {t('taskStatusPending')}</span>;
    }

    if (!isTaskSuccessful(task)) {
      return <span><ExclamationCircleOutlined className="BatchesPage-errorIcon" /> {t('taskStatusFailed')}</span>;
    }

    return doesTaskHaveErrors(task)
      ? <span><WarningOutlined className="BatchesPage-warningIcon" /> {t('taskStatusDoneWithWarnings')}</span>
      : <span><CheckOutlined className="BatchesPage-successIcon" /> {t('taskStatusDone')}</span>;
  };

  const renderBatchType = batchType => {
    switch (batchType) {
      case BATCH_TYPE.documentImport:
        return t('batchTypeDocumentImport');
      case BATCH_TYPE.documentRegeneration:
        return t('batchTypeDocumentRegeneration');
      case BATCH_TYPE.cdnResourcesConsolidation:
        return t('batchTypeCdnResourcesConsolidation');
      case BATCH_TYPE.cdnUploadDirectoryCreation:
        return t('batchTypeCdnUploadDirectoryCreation');
      default:
        throw new Error(`Invalid batch type '${batchType}'`);
    }
  };

  const renderBatchStatus = progress => {
    if (progress === 1) {
      return t('batchStatusDone');
    }
    if (progress === 0) {
      return t('batchStatusPending');
    }
    return t('batchStatusProcessing', { progress });
  };

  const renderDate = date => formatDate(date);

  const renderDocumentTitle = taskParams => {
    const docUrl = urls.getImportedDocUrl({
      hostName: batch.batchParams.hostName,
      allowUnsecure: batch.batchParams.allowUnsecure,
      id: taskParams.documentId,
      slug: taskParams.slug
    });

    return <a target="_blank" href={docUrl} rel="noreferrer noopener">{taskParams.title}</a>;
  };

  const renderDocumentRegenerationEntityId = taskParams => (
    <a target="_blank" href={urls.getDocUrl({ id: taskParams.documentId })} rel="noreferrer noopener">
      {taskParams.documentId}
    </a>
  );

  const renderCdnResourcesConsolidationEntityId = taskParams => {
    const url = urls.getDocUrl({ id: taskParams.documentId });
    const text = taskParams.documentId;

    return <a target="_blank" href={url} rel="noreferrer noopener">{text}</a>;
  };

  const renderCdnUploadDirectoryCreationEntityId = taskParams => {
    let url;
    let text;
    switch (taskParams.type) {
      case CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.document:
        url = urls.getDocUrl({ id: taskParams.documentId });
        text = taskParams.documentId;
        break;
      case CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.lesson:
        url = urls.getLessonUrl({ id: taskParams.lessonId });
        text = taskParams.lessonId;
        break;
      case CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.room:
        url = urls.getRoomUrl({ id: taskParams.roomId });
        text = taskParams.roomId;
        break;
      default:
        throw new Error(`Invalid task params type '${taskParams.type}'`);
    }

    return <a target="_blank" href={url} rel="noreferrer noopener">{text}</a>;
  };

  const renderCdnUploadDirectoryCreationTaskType = taskParams => {
    switch (taskParams.type) {
      case CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.document:
        return t('common:document');
      case CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.lesson:
        return t('common:lesson');
      case CDN_UPLOAD_DIRECTORY_CREATION_TASK_TYPE.room:
        return t('common:room');
      default:
        throw new Error(`Invalid task params type '${taskParams.type}'`);
    }
  };

  const renderDocumentImportType = taskParams => <ImportTypeIcon importType={taskParams.importType} />;

  const renderErrorCount = attempt => <span>{attempt.errors?.length || 0} {t('errors')}</span>;

  const renderErrors = attempt => (
    <List
      dataSource={attempt.errors.map(JSON.stringify)}
      renderItem={error => <List.Item>{error}</List.Item>}
      />
  );

  const attemtpsTableColumns = [
    { title: t('common:startedOn'), dataIndex: 'startedOn', width: '50px', render: renderDate },
    { title: t('common:completedOn'), dataIndex: 'completedOn', width: '150px', render: renderDate },
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
    case BATCH_TYPE.documentImport:
      taskTableColumns.push({
        title: t('documentImportType'),
        key: 'documentImportType',
        dataIndex: 'taskParams',
        render: renderDocumentImportType
      });
      taskTableColumns.push({
        title: t('common:document'),
        key: 'documentTitle',
        dataIndex: 'taskParams',
        render: renderDocumentTitle
      });
      break;
    case BATCH_TYPE.documentRegeneration:
      taskTableColumns.push({
        title: t('common:document'),
        key: 'taskParamsTypeEntityId',
        dataIndex: 'taskParams',
        render: renderDocumentRegenerationEntityId
      });
      break;
    case BATCH_TYPE.cdnResourcesConsolidation:
      taskTableColumns.push({
        title: `${t('common:document')} / ${t('common:lesson')}`,
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
    case BATCH_TYPE.cdnUploadDirectoryCreation:
      taskTableColumns.push({
        title: `${t('common:document')} / ${t('common:lesson')} / ${t('common:room')}`,
        key: 'taskParamsTypeEntityId',
        dataIndex: 'taskParams',
        render: renderCdnUploadDirectoryCreationEntityId
      });
      taskTableColumns.push({
        title: t('common:type'),
        key: 'taskParamsType',
        dataIndex: 'taskParams',
        render: renderCdnUploadDirectoryCreationTaskType
      });
      break;
    default:
      throw new Error(`Invalid batch type '${batch.batchType}'`);
  }

  taskTableColumns.push({
    title: t('taskStatus'),
    dataIndex: 'processed',
    render: renderTaskStatus,
    sorter: taskStatusSorter
  });

  const batchInfos = [<span key="batch-type">{t('batchType')}: {renderBatchType(batch.batchType)}</span>];
  if (batch.batchType === BATCH_TYPE.documentImport) {
    batchInfos.push(<span key="document-input-source">{t('documentImportSource')}: {batch.batchParams.name}</span>);
  }

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
          <div>{t('common:status')}: {renderBatchStatus(batch.progress)}</div>
          <div>{t('common:createdOn')}: {renderDate(batch.createdOn)}</div>
          <div>{t('common:completedOn')}: {renderDate(batch.completedOn)}</div>
          <div>{t('common:user')}: {batch.createdBy.username}</div>
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
        <Table
          size="small"
          bordered
          rowKey="_id"
          dataSource={batch.tasks}
          columns={taskTableColumns}
          pagination={false}
          expandable={{
            expandedRowRender: renderAttemptsSubTable,
            rowExpandable: task => task.attempts?.length
          }}
          />
      </div>
    </PageTemplate>);
}

Batches.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    batch: PropTypes.oneOfType([
      documentImportBatchDetailsShape,
      documentRegenerationBatchDetailsShape,
      cdnResourcesConsolidationBatchDetailsShape,
      cdnUploadDirectoryCreationBatchDetailsShape
    ]).isRequired
  }).isRequired
};

export default Batches;
