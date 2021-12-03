import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../language-context.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { getImportedArticleUrl } from '../../utils/urls.js';
import { DOCUMENT_IMPORT_TYPE } from '../../common/constants.js';
import { Table, Row, Space, Tooltip, Collapse, List } from 'antd';
import { importBatchDetailsShape } from '../../ui/default-prop-types.js';
import { isTaskSuccessful, taskStatusSorter, doesTaskHaveErrors } from '../../utils/task-utils.js';
import { CloudDownloadOutlined, CloudSyncOutlined, WarningOutlined, CheckOutlined, ExclamationCircleOutlined, SyncOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

function ImportBatchView({ initialState, PageTemplate }) {
  const { t } = useTranslation('importBatchView');
  const { formatDate } = useDateFormat();

  const { batch } = initialState;
  const { hostName, allowUnsecure } = batch.batchParams;

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
  const renderTitle = ({ title, slug }) => (
    <a
      target="_blank"
      href={getImportedArticleUrl({ hostName, allowUnsecure, slug })}
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
      dataSource={errors}
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
        <Collapse>
          <Panel header={t('batchErrors')} extra={renderErrorCount(batch)}>
            <List
              dataSource={batch.errors}
              renderItem={error => (
                <List.Item>
                  <span>{error}</span>
                </List.Item>)}
              />
          </Panel>
        </Collapse>
        <Table
          className="ImportBatchViewPage-tasksTable"
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
