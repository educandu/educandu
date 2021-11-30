import React from 'react';
import Page from '../page.js';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import { useTranslation } from 'react-i18next';
import { Table, Collapse, Button } from 'antd';
import { useDateFormat } from '../language-context.js';
import { importBatchShape, importSourceShape } from '../../ui/default-prop-types.js';

const Panel = Collapse.Panel;

function Imports({ initialState }) {
  const { t } = useTranslation('imports');
  const { formatDate } = useDateFormat();

  const { batches, importSources } = initialState;
  let sourceMap = importSources.reduce((acc, source) => {
    acc[source.hostName] = { name: source.name, batches: [] };
    return acc;
  }, {});

  sourceMap = batches.reduce((acc, batch) => {
    const hostName = batch.batchParams.hostName;
    acc[hostName] = {
      name: batch.batchParams.name,
      batches: [...acc[hostName].batches || [], batch]
    };
    return acc;
  }, sourceMap);

  const sources = Object.entries(sourceMap).map(([key, value]) => ({
    importSourceHost: key,
    importSourceName: value.name,
    batches: value.batches
  }));

  const handleCreateImport = source => {
    window.location = urls.getCreateImportUrl(source.importSourceHost);
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

  const defaultActiveKey = sources.filter(source => source.batches.length)
    .map(source => source.importSourceName);

  return (
    <Page>
      <div className="CreateImportPage">
        <h1>{t('pageNames:imports')}</h1>
        <Collapse defaultActiveKey={defaultActiveKey}>
          {sources.map(source => (
            <Panel header={header(source)} key={source.importSourceName} extra={getExtra(source)} >
              <Table
                key={source.importSourceName}
                rowKey="_id"
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
    batches: PropTypes.arrayOf(importBatchShape).isRequired,
    importSources: PropTypes.arrayOf(importSourceShape).isRequired
  }).isRequired
};

export default Imports;
