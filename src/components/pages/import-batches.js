import by from 'thenby';
import React from 'react';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import { useTranslation } from 'react-i18next';
import { Table, Collapse, Button } from 'antd';
import { useDateFormat } from '../language-context.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { useReloadPersistedWindow } from '../../ui/hooks.js';
import { importBatchShape, importSourceShape } from '../../ui/default-prop-types.js';

const Panel = Collapse.Panel;

function ImportBatches({ initialState, PageTemplate }) {
  const { t } = useTranslation('importBatches');
  const { formatDate } = useDateFormat();
  useReloadPersistedWindow();

  const { batches, importSources } = initialState;
  let sourceMap = importSources.reduce((acc, source) => {
    acc[source.hostName] = { name: source.name, batches: [] };
    return acc;
  }, {});

  sourceMap = batches.reduce((acc, batch) => {
    const hostName = batch.batchParams.hostName;
    acc[hostName] = {
      name: batch.batchParams.name,
      batches: [...acc[hostName]?.batches || [], batch]
    };
    return acc;
  }, sourceMap);

  const sources = Object.entries(sourceMap).map(([key, value]) => ({
    importSourceHost: key,
    importSourceName: value.name,
    batches: value.batches.sort(by(batch => batch.createdOn, 'desc'))
  }));

  const handleCreateImport = source => {
    window.location = urls.getCreateImportUrl(source.importSourceHost);
  };

  const renderId = id => <a href={urls.getBatchUrl(id)}>{t('viewBatch')}</a>;

  const renderStatus = batch => {
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
    { title: t('common:createdOn'), width: '150px', dataIndex: 'createdOn', render: renderDate },
    { title: t('completedOn'), width: '150px', dataIndex: 'completedOn', render: renderDate },
    { title: t('common:createdBy'), width: '150px', dataIndex: 'createdBy', render: renderUser }
  ];

  const getExtra = source => {
    const isCreateButtonDisabled = source.batches.some(batch => !batch.completedOn);
    return (
      <Button
        disabled={isCreateButtonDisabled}
        onClick={() => { handleCreateImport(source); }}
        >
        {t('createImport')}
      </Button>);
  };

  const header = source => {
    return (
      <span className="ImportBatchesPage-header" >{t('importsHeaderPrefix')}: {source.importSourceName}</span>
    );
  };

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts}>
      <div className="ImportBatchesPage">
        <h1>{t('pageNames:importBatches')}</h1>
        {!sources.length && <h2>{t('noImportSourcesConfigured')}</h2>}
        {sources.map(source => (
          <Collapse
            key={`collapse-${source.importSourceName}`}
            className="ImportBatchesPage-sourceCollapse"
            defaultActiveKey={source.batches.length ? `panel-${source.importSourceName}` : null}
            >
            <Panel
              header={header(source)}
              className="ImportBatchesPage-batchTablePanel"
              extra={getExtra(source)}
              key={`panel-${source.importSourceName}`}
              >
              <Table
                size="small"
                rowKey="_id"
                dataSource={source.batches}
                columns={columns}
                pagination={false}
                />
            </Panel>
          </Collapse>
        ))}
      </div>
    </PageTemplate>);
}

ImportBatches.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    batches: PropTypes.arrayOf(importBatchShape).isRequired,
    importSources: PropTypes.arrayOf(importSourceShape).isRequired
  }).isRequired
};

export default ImportBatches;
