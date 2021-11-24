import by from 'thenby';
import Page from '../page.js';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import React, { useState, useEffect } from 'react';
import Logger from '../../common/logger.js';
import { useTranslation } from 'react-i18next';
import { Tooltip, Button, Table, Select } from 'antd';
import { handleApiError } from '../../ui/error-helper.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { inject, useService } from '../container-context.js';
import { DOCUMENT_IMPORT_TYPE } from '../../common/constants.js';
import ImportApiClient from '../../services/import-api-client.js';
import { clientConfigProps } from '../../ui/default-prop-types.js';
import { useDateFormat, useLanguage } from '../language-context.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import { CloudDownloadOutlined, CloudSyncOutlined } from '@ant-design/icons';
import { useRequest } from '../request-context.js';

const logger = new Logger(import.meta.url);

function CreateImport({ clientConfig, importApiClient }) {
  const { t } = useTranslation('create-import');

  const { language } = useLanguage();
  const { formatDate } = useDateFormat();
  const languageNameProvider = useService(LanguageNameProvider);

  const sourceMenuItems = clientConfig.importSources;
  const { query } = useRequest();
  const importSourceName = urls.decodeUrl(query.source);
  const [selectedSource] = useState(sourceMenuItems.find(source => source.name === importSourceName));

  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState([]);
  const [importableDocuments, setImportableDocuments] = useState([]);
  const [isFetchingImportableDocuments, setIsFetchingImportableDocuments] = useState(false);

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

  useEffect(() => {
    const getDocuments = async () => {
      setIsFetchingImportableDocuments(true);

      setImportableDocuments([]);
      setSelectedDocumentKeys([]);

      try {
        const { documents } = await importApiClient.getImports(selectedSource.name);
        setImportableDocuments(documents);
      } catch (error) {
        handleApiError({ error, t });
      }
      setIsFetchingImportableDocuments(false);
    };

    getDocuments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource]);

  const renderImportType = doc => {
    let icon = null;
    if (doc.importType === DOCUMENT_IMPORT_TYPE.add) {
      icon = <CloudDownloadOutlined />;
    }
    if (doc.importType === DOCUMENT_IMPORT_TYPE.update) {
      icon = <CloudSyncOutlined />;
    }
    return <Tooltip title={t(doc.importType)} className="CreateImportPage-importType">{icon}</Tooltip>;
  };

  const renderTitle = doc => {
    if (!doc.slug) {
      return <span>{doc.title}</span>;
    }

    const url = `${selectedSource.baseUrl}${urls.getArticleUrl(doc.slug)}`;
    return <a href={url} target="_blank" rel="noopener noreferrer" >{doc.title}</a>;
  };

  const renderLanguage = doc => {
    const languagesData = languageNameProvider.getData(language);
    const documentLanguageData = languagesData[doc.language];
    return <CountryFlagAndName code={documentLanguageData.flag} name={documentLanguageData.name} flagOnly />;
  };

  const renderUpdateDate = doc => {
    return <span>{formatDate(doc.updatedOn)}</span>;
  };

  const columns = [
    { title: t('importType'), key: 'importType', width: '150px', sorter: by(x => x.importType), render: renderImportType },
    { title: t('title'), key: 'title', sorter: by(x => x.title), render: renderTitle },
    { title: t('language'), key: 'language', width: '150px', sorter: by(x => x.language), render: renderLanguage },
    { title: t('updateDate'), key: 'updateDate', width: '200px', sorter: by(x => x.updatedOn), render: renderUpdateDate }
  ];

  const tableRowSelection = {
    onChange: selectedRowKeys => {
      setSelectedDocumentKeys(selectedRowKeys);
    }
  };

  return (
    <Page>
      <div className="CreateImportPage">
        <h1>{t('pageNames:import')}</h1>

        <Select
          placeholder={t('source')}
          className="CreateImportPage-source"
          defaultValue={importSourceName}
          disabled
          />
        <br /> <br />

        <Table
          bordered
          size="small"
          rowSelection={{
            type: 'checkbox',
            ...tableRowSelection
          }}
          columns={columns}
          pagination={false}
          dataSource={importableDocuments}
          loading={isFetchingImportableDocuments}
          no-data={importableDocuments.length === 0}
          />
        <br />
        <Button type="primary" disabled={!selectedDocumentKeys.length} onClick={handleImportClick}>
          {t('importButton')}
        </Button>
      </div>
    </Page>
  );
}

CreateImport.propTypes = {
  ...clientConfigProps,
  importApiClient: PropTypes.instanceOf(ImportApiClient).isRequired
};

export default inject({
  clientConfig: ClientConfig,
  importApiClient: ImportApiClient
}, CreateImport);
