import by from 'thenby';
import React from 'react';
import PropTypes from 'prop-types';
import routes from '../../utils/routes.js';
import { useTranslation } from 'react-i18next';
import { Table, Collapse, Button } from 'antd';
import { useDateFormat } from '../locale-context.js';
import { batchShape, importSourceShape } from '../../ui/default-prop-types.js';

const Panel = Collapse.Panel;

function Imports({ initialState, PageTemplate }) {
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
    window.location = routes.getCreateImportUrl(source.importSourceHost);
  };

  const renderId = id => <a href={routes.getBatchUrl(id)}>{t('viewBatch')}</a>;

  const renderStatus = batch => {
    if (batch.progress === 1) {
      return <span>{t('batchStatusDone')}</span>;
    }
    if (batch.progress === 0) {
      return <span>{t('batchStatusPending')}</span>;
    }
    return <span>{t('batchStatusProcessing', { progress: batch.progress })}</span>;
  };

  const renderDate = date => <span>{formatDate(date)}</span>;

  const renderUser = user => <span>{user.username}</span>;

  const columns = [
    { title: t('batchId'), key: '_id', dataIndex: '_id', width: '150px', render: renderId },
    { title: t('batchStatus'), width: '150px', render: renderStatus },
    { title: t('common:createdOn'), width: '150px', dataIndex: 'createdOn', render: renderDate, responsive: ['md'] },
    { title: t('common:completedOn'), width: '150px', dataIndex: 'completedOn', render: renderDate, responsive: ['md'] },
    { title: t('common:user'), width: '150px', dataIndex: 'createdBy', render: renderUser, responsive: ['lg'] }
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
      <span className="ImportsPage-header" >{t('importsHeaderPrefix')}: {source.importSourceName}</span>
    );
  };

  return (
    <PageTemplate>
      <div className="ImportsPage">
        <h1>{t('pageNames:imports')}</h1>
        {!sources.length && <h2>{t('noImportSourcesConfigured')}</h2>}
        {sources.map(source => (
          <Collapse
            key={`collapse-${source.importSourceName}`}
            className="ImportsPage-sourceCollapse"
            defaultActiveKey={source.batches.length ? `panel-${source.importSourceName}` : null}
            >
            <Panel
              header={header(source)}
              className="ImportsPage-batchTablePanel"
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

Imports.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    batches: PropTypes.arrayOf(batchShape).isRequired,
    importSources: PropTypes.arrayOf(importSourceShape).isRequired
  }).isRequired
};

export default Imports;
