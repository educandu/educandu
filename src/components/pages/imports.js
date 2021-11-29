import React from 'react';
import PropTypes from 'prop-types';
import Page from '../page.js';
import { useTranslation } from 'react-i18next';
import { Table, Collapse, Button } from 'antd';
import urls from '../../utils/urls.js';
import { useDateFormat } from '../language-context.js';
import { importBatchShape } from '../../ui/default-prop-types.js';

const Panel = Collapse.Panel;

function Imports({ initialState }) {
  const { t } = useTranslation('imports');
  const { formatDate } = useDateFormat();

  const { batches } = initialState;

  const sourceMap = batches.reduce((acc, batch) => {
    acc[batch.batchParams.source] = [...acc[batch.batchParams.source] || [], batch];
    return acc;
  }, {});

  const sources = Object.entries(sourceMap).map(([key, value]) => ({
    importSourceName: key,
    batches: value
  }));

  const handleCreateImport = source => {
    window.location = urls.getCreateImportUrl(source.importSourceName);
  };

  const renderId = id => <a href={urls.getBatchUrl(id)}>{t('viewBatch')}</a>;

  const renderStatus = (_, batch) => {
    if (batch.progress === 1) {
      return <span>{t('batchStatusDone')}</span>;
    }
    if (batch.progress === 0) {
      return <span>{t('batchStatusPending')}</span>;
    }
    return <span>{t('batchStatusProcessing', { progress: batch.progress })}</span>;
  };

  const renderDate = doc => <span>{formatDate(doc)}</span>;

  const renderUser = user => <span>{user.username}</span>;

  const columns = [
    { title: t('batchId'), key: '_id', dataIndex: '_id', width: '150px', render: renderId },
    { title: t('batchStatus'), width: '150px', render: renderStatus },
    { title: t('createdOn'), width: '150px', dataIndex: 'createdOn', render: renderDate },
    { title: t('completedOn'), width: '150px', dataIndex: 'completedOn', render: renderDate },
    { title: t('createdBy'), width: '150px', dataIndex: 'createdBy', render: renderUser }
  ];

  const getExtra = source => {
    const isCreateButtonDisabled = source.batches.some(batch => !batch.completedOn);
    return (
      <Button
        disabled={isCreateButtonDisabled}
        onClick={() => { handleCreateImport(source); }}
        >{t('createImport')}
      </Button>);
  };

  const header = source => {
    return (
      <span style={{ marginRight: '20px' }}>{t('importsHeaderPrefix')}: {source.importSourceName}</span>
    );
  };

  return (
    <Page>
      <div className="CreateImportPage">
        <h1>{t('pageNames:imports')}</h1>
        <Collapse defaultActiveKey={sources.map(source => source.importSourceName)}>
          {sources.map(source => (
            <Panel header={header(source)} key={source.importSourceName} extra={getExtra(source)} >
              <Table
                key={source.importSourceName}
                dataSource={source.batches}
                columns={columns}
                pagination={false}
                />
            </Panel>))}
        </Collapse>
      </div>
    </Page>);
}

Imports.propTypes = {
  initialState: PropTypes.shape({
    batches: PropTypes.arrayOf(importBatchShape).isRequired
  }).isRequired
};

export default Imports;
