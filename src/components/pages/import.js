import React from 'react';
import Page from '../page.js';
import { Button, Table } from 'antd';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';

const logger = new Logger(import.meta.url);

function Import({ documents }) {
  const { t } = useTranslation('import');

  const handleImportClick = () => {
    logger.info('Dummy import');
  };

  const columns = [
    { title: t('import'), key: 'import', width: '64px', render: () => { } },
    { title: t('importType'), key: 'importType', dataIndex: 'importType', render: () => { } },
    { title: t('title'), key: 'title', render: () => { } },
    { title: t('language'), key: 'language', width: '100px', render: () => { } },
    { title: t('updateDate'), key: 'updateDate', width: '150px', render: () => { } }
  ];

  const rows = [{ import: '', importType: '', title: '', language: '', updateDate: '' }];

  return (
    <Page>
      <div className="ImportPage">
        <h1>{t('pageNames:import')}</h1>

        <Table
          size="small"
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          />

        <br />
        <Button type="primary" onClick={handleImportClick}>
          {t('importButton')}
        </Button>
      </div>
    </Page>
  );
}

export default Import;
