import PropTypes from 'prop-types';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState } from 'react';
import { useService } from '../container-context.js';
import { useDateFormat } from '../language-context.js';
import { getImportedDocUrl } from '../../utils/urls.js';
import { handleApiError } from '../../ui/error-helper.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { DOCUMENT_IMPORT_TYPE } from '../../common/constants.js';
import ImportApiClient from '../../services/import-api-client.js';
import { Table, Row, Space, Tooltip, Collapse, List } from 'antd';
import { importBatchDetailsShape } from '../../ui/default-prop-types.js';
import { isTaskSuccessful, taskStatusSorter, doesTaskHaveErrors } from '../../utils/task-utils.js';
import { CloudDownloadOutlined, CloudSyncOutlined, WarningOutlined, CheckOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const POLL_INTERVAL_IN_MS = 500;
const logger = new Logger(import.meta.url);

function ImportBatchView({ initialState, PageTemplate }) {
  const { t } = useTranslation('importBatchView');
  const { formatDate } = useDateFormat();
  const importApiClient = useService(ImportApiClient);

  const [batch, setBatch] = useState(initialState.batch);

  const { _id: id, progress: batchProgress } = batch;
  const { hostName, allowUnsecure } = batch.batchParams;

  useEffect(() => {
    let nextTimeout = null;
    const getUpdate = async () => {
      if (batchProgress === 1) {
        return;
      }

      try {
        const updatedBatchDetails = await importApiClient.getImportBatch(id);
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
  }, [t, importApiClient, id, batchProgress]);

  const renderTaskStatus = (processed, task) => {
    if (!processed) {
      return <span><SyncOutlined spin /> {t('taskStatusPending')}</span>;
    }

    if (!isTaskSuccessful(task)) {
      return <span><ExclamationCircleOutlined className="ImportBatchViewPage-failedIcon" /> {t('taskStatusFailed')}</span>;
    }

    return doesTaskHaveErrors(task)
      ? <span><WarningOutlined className="ImportBatchViewPage-warningIcon" /> {t('taskStatusDoneWithWarnings')}</span>
      : <span><CheckOutlined className="ImportBatchViewPage-doneIcon" /> {t('taskStatusDone')}</span>;
  };

  const renderBatchStatus = ({ progress }) => {
    if (progress === 1) {
      return <span>{t('batchStatusDone')}</span>;
    }
    if (progress === 0) {
      return <span>{t('batchStatusPending')}</span>;
    }
    return <span>{t('batchStatusProcessing', { progress: batch.progress })}</span>;
  };

  const renderDate = date => <span>{formatDate(date)}</span>;
  const renderTitle = ({ title, key, slug }) => (
    <a
      target="_blank"
      href={getImportedDocUrl({ hostName, allowUnsecure, key, slug })}
      rel="noreferrer noopener"
      >
      {title}
    </a>
  );

  const renderImportType = taskParams => {
    let icon = null;
    if (taskParams.importType === DOCUMENT_IMPORT_TYPE.add) {
      icon = <CloudDownloadOutlined />;
    }
    if (taskParams.importType === DOCUMENT_IMPORT_TYPE.update) {
      icon = <CloudSyncOutlined />;
    }
    return <Tooltip title={t(taskParams.importType)} className="ImportBatchViewPage-importType">{icon}</Tooltip>;
  };

  const renderErrorCount = ({ errors }) => <span>{errors?.length || 0} {t('errors')}</span>;

  const renderErrors = ({ errors }) => (
    <List
      dataSource={errors.map(JSON.stringify)}
      renderItem={error => (
        <List.Item>
          <span>{error}</span>
        </List.Item>)}
      />
  );

  const attemtpsTableColumns = [
    { title: t('startedOn'), dataIndex: 'startedOn', width: '50px', render: renderDate },
    { title: t('completedOn'), key: '_id', dataIndex: 'completedOn', width: '150px', render: renderDate },
    { title: t('errorsCount'), width: '150px', render: renderErrorCount }
  ];

  const attemptsRenderer = task => (
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
    { title: t('importType'), dataIndex: 'taskParams', width: '50px', render: renderImportType },
    { title: t('documentTitle'), key: '_id', dataIndex: 'taskParams', width: '150px', render: renderTitle },
    { title: t('taskStatus'), dataIndex: 'processed', width: '150px', render: renderTaskStatus, sorter: taskStatusSorter }
  ];

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts}>
      <div className="ImportBatchViewPage">
        <div><a href="/import-batches">{t('backToImports')}</a></div>
        <h1>{t('pageNames:importBatchView')}</h1>
        <Row>
          <Space>
            <span>{t('batchStatus')}:</span>
            <span>{renderBatchStatus(batch)}</span>
          </Space>
        </Row>
        <Row>
          <Space>
            <span>{t('createdOn')}:</span>
            <span>{renderDate(batch.createdOn)}</span>
          </Space>
        </Row>
        <Row>
          <Space>
            <span>{t('completedOn')}:</span>
            <span>{renderDate(batch.completedOn)}</span>
          </Space>
        </Row>
        <Row>
          <Space>
            <span>{t('createdBy')}:</span>
            <span>{batch.createdBy.username}</span>
          </Space>
        </Row>
        <br />
        <Collapse>
          <Panel header={t('batchErrors')} extra={renderErrorCount(batch)}>
            <List
              dataSource={batch.errors.map(JSON.stringify)}
              renderItem={error => (
                <List.Item>
                  <span>{error}</span>
                </List.Item>)}
              />
          </Panel>
        </Collapse>
        <Table
          className="ImportBatchViewPage-tasksTable"
          size="small"
          bordered
          key={batch._id}
          rowKey="_id"
          dataSource={batch.tasks}
          columns={taskTableColumns}
          pagination={false}
          expandable={{
            expandedRowRender: attemptsRenderer,
            rowExpandable: task => task.attempts?.length
          }}
          />
      </div>
    </PageTemplate>);
}

ImportBatchView.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    batch: importBatchDetailsShape.isRequired
  }).isRequired
};

export default ImportBatchView;
