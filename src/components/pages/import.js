import by from 'thenby';
import Page from '../page.js';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import React, { useState } from 'react';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { Button, Table, Menu, Dropdown, Spin } from 'antd';
import { inject, useService } from '../container-context.js';
import { DOCUMENT_IMPORT_TYPE } from '../../common/constants.js';
import ImportApiClient from '../../services/import-api-client.js';
import { useDateFormat, useLanguage } from '../language-context.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import { DownOutlined, CloudDownloadOutlined, CloudSyncOutlined } from '@ant-design/icons';

const logger = new Logger(import.meta.url);

function Import({ initialState, importApiClient }) {
  const { t } = useTranslation('import');

  const { language } = useLanguage();
  const { formatDate } = useDateFormat();
  const languageNameProvider = useService(LanguageNameProvider);

  const defaultSourceMenuItem = { name: t('source') };
  const sourceMenuItems = [defaultSourceMenuItem, ...initialState.importSources];
  const [selectedSource, setSelectedSource] = useState(defaultSourceMenuItem);
  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState([]);
  const [importableDocuments, setImportableDocuments] = useState([]);

  const handleImportClick = () => {
    const tasks = selectedDocumentKeys
      .map(key => importableDocuments.find(doc => doc.key === key))
      .map(doc => ({
        key: doc.key,
        importedRevision: doc.importedRevision,
        importableRevision: doc.importableRevision
      }));
    logger.info(`Dummy import sets tasks: ${JSON.stringify(tasks)}`);
  };

  const handleSourceMenuClick = async ({ key }) => {
    const newSelectedSource = sourceMenuItems.find(source => source.name === key);
    setSelectedSource(newSelectedSource);
    setImportableDocuments([]);
    setSelectedDocumentKeys([]);

    const { documents } = await importApiClient.getImports(newSelectedSource);
    setImportableDocuments(documents);
  };

  const renderImportType = doc => {
    let icon = doc.importType;
    if (doc.importType === DOCUMENT_IMPORT_TYPE.add) {
      icon = <CloudDownloadOutlined />;
    }
    if (doc.importType === DOCUMENT_IMPORT_TYPE.update) {
      icon = <CloudSyncOutlined />;
    }
    return <div className="ImportPage-importType">{icon}</div>;
  };

  const renderTitle = doc => {
    if (!doc.slug) {
      return <span>{doc.title}</span>;
    }

    const url = `${selectedSource.baseUrl}${urls.getArticleUrl(doc.slug)}`;
    return <a href={url}>{doc.title}</a>;
  };

  const renderLanguage = doc => {
    const langaugesData = languageNameProvider.getData(language);
    const documentLanguageData = langaugesData[doc.language];
    return <CountryFlagAndName code={documentLanguageData.flag} name={documentLanguageData.name} flagOnly />;
  };

  const renderUpdateDate = doc => {
    return <span>{formatDate(doc.updatedOn)}</span>;
  };

  const columns = [
    { title: t('importType'), key: 'importType', width: '100px', sorter: by(x => x.importType), render: renderImportType },
    { title: t('title'), key: 'title', sorter: by(x => x.title), render: renderTitle },
    { title: t('language'), key: 'language', width: '100px', sorter: by(x => x.language), render: renderLanguage },
    { title: t('updateDate'), key: 'updateDate', width: '150px', sorter: by(x => x.updatedOn), render: renderUpdateDate }
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
              dataSource={importableDocuments}
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
