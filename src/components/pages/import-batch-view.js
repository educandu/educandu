import React from 'react';
import Page from '../page.js';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../language-context.js';
import { getImportedArticleUrl } from '../../utils/urls.js';
import { DOCUMENT_IMPORT_TYPE } from '../../common/constants.js';
import { Table, Row, Space, Tooltip, Collapse, List } from 'antd';
import { importBatchDetailsShape } from '../../ui/default-prop-types.js';
import { CloudDownloadOutlined, CloudSyncOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

function ImportBatchView({ initialState }) {
  const { t } = useTranslation('importBatchView');
  const { formatDate } = useDateFormat();

  const { batch } = initialState;
  const { hostName, allowUnsecure } = batch.batchParams;

  const renderStatus = processed => {
    return processed
      ? <span>{t('taskStatusDone')}</span>
      : <span>{t('taskStatusPending')}</span>;
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
      >{title}
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

  const renderErrors = errors => <span>{errors.join(';')}</span>;
  const attemtpsColumns = [
    { title: t('startedOn'), dataIndex: 'startedOn', width: '50px', render: renderDate },
    { title: t('completedOn'), key: '_id', dataIndex: 'completedOn', width: '150px', render: renderDate },
    { title: t('errors'), dataIndex: 'errors', width: '150px', render: renderErrors }
  ];

  const renderHeader = () => <span>{t('attemptsHeader')}</span>;
  const renderErrorsExtra = ({ errors }) => <span>{errors?.length || 0} {t('errors')}</span>;

  const attemptsRenderer = (attempts, task) => {
    const errors = task.attempts.map(attempt => attempt.errors).flat();
    return (
      <Collapse>
        <Panel key={task._id} header={renderHeader()} extra={renderErrorsExtra({ errors })}>
          <Table
            key={task._id}
            rowKey={attempt => `${task._id}_${attempt.startedOn}}`}
            dataSource={attempts}
            columns={attemtpsColumns}
            pagination={false}
            />
        </Panel>
      </Collapse>
    );
  };

  const columns = [
    { title: t('importType'), dataIndex: 'taskParams', width: '50px', render: renderImportType },
    { title: t('documentTitle'), key: '_id', dataIndex: 'taskParams', width: '150px', render: renderTitle },
    { title: t('taskStatus'), dataIndex: 'processed', width: '150px', render: renderStatus },
    { title: t('attemptsHeader'), dataIndex: 'attempts', width: '150px', render: attemptsRenderer }
  ];

  return (
    <Page>
      <div className="ImportBatchViewPage">
        <h1>{t('importHeading')}</h1>
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
          <Panel header={t('batchErrors')} extra={renderErrorsExtra(batch)}>
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
          columns={columns}
          pagination={false}
          />
      </div>
    </Page>);
}

ImportBatchView.propTypes = {
  initialState: PropTypes.shape({
    batch: importBatchDetailsShape.isRequired
  }).isRequired
};

export default ImportBatchView;
