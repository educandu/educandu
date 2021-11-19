import Page from '../page.js';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { DownOutlined } from '@ant-design/icons';
import { Button, Table, Menu, Dropdown, Spin } from 'antd';

const logger = new Logger(import.meta.url);

function Import({ initialState }) {
  const { t } = useTranslation('import');

  const defaultSourceMenuItem = { name: t('source') };
  const sourceMenuItems = [defaultSourceMenuItem, ...initialState.importSources];
  const [selectedSource, setSelectedSource] = useState(defaultSourceMenuItem);
  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState([]);
  const [importableDocuments, setImportableDocuments] = useState([]);

  const handleImportClick = () => {
    logger.info('Dummy import');
  };

  const handleSourceMenuClick = ({ key }) => {
    const item = sourceMenuItems.find(source => source.name === key);
    setSelectedSource(item);
    setSelectedDocumentKeys([]);
    setImportableDocuments([]);

    setTimeout(() => {
      setImportableDocuments([
        { key: 'key1', importType: 'a1', title: 'b1', language: 'c1', updatedOn: 'd1' },
        { key: 'key2', importType: 'a2', title: 'b2', language: 'c2', updatedOn: 'd2' }
      ]);
    }, 1500);
  };

  const renderImportType = doc => doc.importType;
  // What of the documents that are missing the slug? and if we use the key, then the user needs to log in
  const renderTitle = doc => <a href={`${selectedSource.baseUrl}/articles/${doc.slug}`}>{doc.title}</a>;
  const renderLanguage = doc => doc.language;
  const renderUpdateDate = doc => doc.updateDate;

  const columns = [
    { title: t('importType'), key: 'importType', width: '100px', render: renderImportType },
    { title: t('title'), key: 'title', render: renderTitle },
    { title: t('language'), key: 'language', width: '100px', render: renderLanguage },
    { title: t('updateDate'), key: 'updateDate', width: '150px', render: renderUpdateDate }
  ];

  const mapDocumentsToRows = documents => {
    return documents.map(doc => ({
      key: doc.key,
      importType: doc.importType,
      title: doc.title,
      language: doc.language,
      updateDate: doc.updatedOn
    }));
  };

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
  initialState: PropTypes.shape({
    importSources: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      baseUrl: PropTypes.string.isRequired,
      apiKey: PropTypes.string.isRequired
    })).isRequired
  }).isRequired
};

export default Import;
