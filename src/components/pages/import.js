import Page from '../page.js';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { DownOutlined } from '@ant-design/icons';
import { inject } from '../container-context.js';
import { Button, Table, Menu, Dropdown, Spin } from 'antd';
import ImportApiClient from '../../services/import-api-client.js';

const logger = new Logger(import.meta.url);

function Import({ initialState, importApiClient }) {
  const { t } = useTranslation('import');

  const defaultSourceMenuItem = { name: t('source') };
  const sourceMenuItems = [defaultSourceMenuItem, ...initialState.importSources];
  const [selectedSource, setSelectedSource] = useState(defaultSourceMenuItem);
  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState([]);
  const [importableDocuments, setImportableDocuments] = useState([]);

  const handleImportClick = () => {
    logger.info('Dummy import');
  };

  const handleSourceMenuClick = async ({ key }) => {
    const newSelectedSource = sourceMenuItems.find(source => source.name === key);
    setSelectedSource(newSelectedSource);
    setImportableDocuments([]);
    setSelectedDocumentKeys([]);

    const { documents } = await importApiClient.getImports(newSelectedSource);
    setImportableDocuments(documents);
  };

  const renderImportType = doc => doc.importType;
  // ToDo: What of the documents that are missing the slug? and if we use the key, then the user needs to log in
  const renderTitle = doc => <a href={`${selectedSource.baseUrl}/articles/${doc.slug}`}>{doc.title}</a>;
  // ToDo: add flag
  const renderLanguage = doc => doc.language;
  // ToDo: format
  const renderUpdateDate = doc => doc.updateDate;

  const columns = [
    { title: t('importType'), key: 'importType', width: '100px', render: renderImportType },
    { title: t('title'), key: 'title', render: renderTitle },
    { title: t('language'), key: 'language', width: '100px', render: renderLanguage },
    { title: t('updateDate'), key: 'updateDate', width: '150px', render: renderUpdateDate }
  ];

  const tableRowSelection = {
    onChange: selectedRowKeys => {
      setSelectedDocumentKeys(selectedRowKeys);
    }
  };

  const sourceMenu = (
    <Menu onClick={handleSourceMenuClick}>
      {sourceMenuItems
        .map(importSource => (
          <Menu.Item key={importSource.name}>
            {importSource.name}
          </Menu.Item>
        ))}
    </Menu>
  );

  const mapDocumentsToRows = documents => {
    return documents.map(doc => ({
      key: doc.key,
      importType: doc.importType,
      title: doc.title,
      language: doc.language,
      updateDate: doc.updatedOn
    }));
  };
  const showSpinner = selectedSource.name !== defaultSourceMenuItem.name && importableDocuments.length === 0;
  const showTable = importableDocuments.length > 0;

  return (
    <Page>
      <div className="ImportPage">
        <h1>{t('pageNames:import')}</h1>

        <Dropdown overlay={sourceMenu} placement="bottomCenter">
          <Button className="ImportPage-sourceButton" disabled={showSpinner}>
            {selectedSource.name}<DownOutlined />
          </Button>
        </Dropdown>
        <br /> <br />

        {showSpinner && <Spin className="ImportPage-spinner" size="large" />}

        {showTable && (
          <React.Fragment>
            <Table
              size="small"
              rowSelection={{
                type: 'checkbox',
                ...tableRowSelection
              }}
              columns={columns}
              dataSource={mapDocumentsToRows(importableDocuments)}
              pagination={false}
              bordered
              />
            <br />
            <Button type="primary" disabled={!selectedDocumentKeys.length} onClick={handleImportClick}>
              {t('importButton')}
            </Button>
          </React.Fragment>
        )}
      </div>
    </Page>
  );
}

Import.propTypes = {
  importApiClient: PropTypes.instanceOf(ImportApiClient).isRequired,
  initialState: PropTypes.shape({
    importSources: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      baseUrl: PropTypes.string.isRequired,
      apiKey: PropTypes.string.isRequired
    })).isRequired
  }).isRequired
};

export default inject({
  importApiClient: ImportApiClient
}, Import);
