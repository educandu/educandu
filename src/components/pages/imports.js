import React from 'react';
import Page from '../page.js';
import { useTranslation } from 'react-i18next';
import { Table, Collapse, Button } from 'antd';
import urls from '../../utils/urls.js';
import { BATCH_TYPE } from '../../common/constants.js';
import { useDateFormat } from '../language-context.js';

const Panel = Collapse.Panel;

const dummySources = [
  {
    importSourceName: 'Ala bala portocala',
    batches: [
      {
        _id: 'jjjj',
        createdBy: 'Hans Remoray',
        createdOn: null,
        completedOn: null,
        batchType: 'import-documents',
        batchParams: {
          source: 'external/portocala'
        },
        errors: []
      },
      {
        _id: 'abcd',
        createdBy: 'Chuck Norris',
        createdOn: new Date().toISOString(),
        completedOn: null,
        batchType: 'import-documents',
        batchParams: {
          source: 'external/portocala'
        },
        errors: []
      },
      {
        _id: 'def',
        createdBy: 'Chuck Norris',
        createdOn: new Date().toISOString(),
        completedOn: new Date().toISOString(),
        batchType: 'import-documents',
        batchParams: {
          source: 'external/portocala'
        },
        errors: ['Oups I did it again']
      },
      {
        _id: 'jsdkjs',
        createdBy: 'Chuck Norris',
        createdOn: new Date().toISOString(),
        completedOn: new Date().toISOString(),
        batchType: 'import-documents',
        batchParams: {
          source: 'external/portocala'
        },
        errors: []
      }
    ]
  },
  {
    importSourceName: 'ELMU - staging',
    batches: [
      {
        _id: 'jdjdks',
        createdBy: 'Brusc Willis',
        createdOn: new Date().toISOString(),
        completedOn: new Date().toISOString(),
        batchType: 'import-documents',
        batchParams: {
          source: 'external/baloon'
        },
        errors: []
      },
      {
        _id: 'jdjdks',
        createdBy: 'Brusc Willis',
        createdOn: new Date().toISOString(),
        completedOn: new Date().toISOString(),
        batchType: 'import-documents',
        batchParams: {
          source: 'external/baloon'
        },
        errors: []
      }
    ]
  }
];

function Imports() {
  const { t } = useTranslation('imports');
  const { formatDate } = useDateFormat();

  const handleCreateImport = source => {
    window.location = urls.getCreateImportUrl(source.importSourceName);
  };

  const renderId = id => {
    return <a href={urls.getBatchUrl(id)}>{t('viewBatch')}</a>;
  };

  const renderStatus = (_, batch) => {
    if (batch.completedOn) {
      return <span>{t('batchStatusDone')}</span>;
    }
    if (batch.createdOn) {
      return <span>{t('batchStatusProcessing')}</span>;
    }
    return <span>{t('batchStatusPending')}</span>;
  };

  const renderBatchType = type => {
    switch (type) {
      case BATCH_TYPE.importDocument:
        return <span>{t('batchTypeImportDocument')}</span>;
      default:
        return <span />;
    }
  };

  const renderDate = doc => {
    return <span>{formatDate(doc)}</span>;
  };

  const columns = [
    { title: t('batchId'), key: '_id', dataIndex: '_id', width: '150px', render: renderId },
    { title: t('batchType'), key: 'batchType', dataIndex: 'batchType', width: '150px', render: renderBatchType },
    { title: t('batchStatus'), width: '150px', render: renderStatus },
    { title: t('createdOn'), width: '150px', dataIndex: 'createdOn', render: renderDate },
    { title: t('completedOn'), width: '150px', dataIndex: 'completedOn', render: renderDate },
    { title: t('createdBy'), width: '150px', dataIndex: 'createdBy' }
  ];

  const header = source => {
    const isCreateButtonDisabled = source.batches.some(batch => !batch.completedOn);
    return (
      <React.Fragment>
        <span style={{ marginRight: '20px' }}>{source.importSourceName}</span>
        <Button disabled={isCreateButtonDisabled} onClick={() => { handleCreateImport(source); }}>{t('createImport')}</Button>
      </React.Fragment>
    );
  };

  return (
    <Page>
      <div className="CreateImportPage">
        <h1>{t('pageNames:imports')}</h1>
        <Collapse>
          {dummySources.map(source => (
            <Panel header={header(source)} key={source.importSourceName} >
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

export default Imports;
