import React from 'react';
import { Table, Row, Space, Tooltip } from 'antd';
import Page from '../page.js';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '../language-context.js';
import { importBatchShape } from '../../ui/default-prop-types.js';
import { getImportedArticleUrl } from '../../utils/urls.js';
import { CloudDownloadOutlined, CloudSyncOutlined } from '@ant-design/icons';
import { DOCUMENT_IMPORT_TYPE } from '../../common/constants.js';

function Import({ initialState }) {
  const { t } = useTranslation('import');
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
      rel="noreferrer"
      >{title}
    </a>);

  const renderImportType = taskParams => {
    let icon = null;
    if (taskParams.importType === DOCUMENT_IMPORT_TYPE.add) {
      icon = <CloudDownloadOutlined />;
    }
    if (taskParams.importType === DOCUMENT_IMPORT_TYPE.update) {
      icon = <CloudSyncOutlined />;
    }
    return <Tooltip title={t(taskParams.importType)} className="CreateImportPage-importType">{icon}</Tooltip>;
  };

  const columns = [
    { title: t('importType'), dataIndex: 'taskParams', width: '50px', render: renderImportType },
    { title: t('documentTitle'), key: '_id', dataIndex: 'taskParams', width: '150px', render: renderTitle },
    { title: t('taskStatus'), dataIndex: 'processed', width: '150px', render: renderStatus }
  ];

  return (
    <Page>
      <div className="CreateImportPage">
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

        <Table
          key={batch._id}
          rowKey="_id"
          dataSource={batch.tasks}
          columns={columns}
          pagination={false}
          />
      </div>
    </Page>);
}

Import.propTypes = {
  initialState: PropTypes.shape({
    batch: importBatchShape.isRequired
  }).isRequired
};

export default Import;
