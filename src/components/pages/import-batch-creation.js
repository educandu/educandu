import by from 'thenby';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useRequest } from '../request-context.js';
import React, { useState, useEffect } from 'react';
import { useService } from '../container-context.js';
import { Tooltip, Button, Table } from 'antd';
import { handleApiError } from '../../ui/error-helper.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useReloadPersistedWindow } from '../../ui/hooks.js';
import { DOCUMENT_IMPORT_TYPE } from '../../common/constants.js';
import ImportApiClient from '../../services/import-api-client.js';
import { useDateFormat, useLanguage } from '../language-context.js';
import LanguageNameProvider from '../../data/language-name-provider.js';
import CountryFlagAndName from '../localization/country-flag-and-name.js';
import { CloudDownloadOutlined, CloudSyncOutlined } from '@ant-design/icons';
import urls, { getArticleUrl, getImportDetailsUrl, getImportSourceBaseUrl } from '../../utils/urls.js';

export default function ImportBatchCreation({ PageTemplate }) {
  const { t } = useTranslation('importBatchCreation');

  const { language } = useLanguage();
  const { formatDate } = useDateFormat();
  const clientConfig = useService(ClientConfig);
  const importApiClient = useService(ImportApiClient);
  const languageNameProvider = useService(LanguageNameProvider);

  const sourceMenuItems = clientConfig.importSources;
  const { query } = useRequest();
  const importSourceHostName = urls.decodeUrl(query.source);
  const [selectedSource] = useState(sourceMenuItems.find(source => source.hostName === importSourceHostName));

  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState([]);
  const [importableDocuments, setImportableDocuments] = useState([]);
  const [isFetchingImportableDocuments, setIsFetchingImportableDocuments] = useState(false);
  const [isCreatingNewImportBatch, setIsCreatingNewImportBatch] = useState(false);

  useReloadPersistedWindow();

  const handleImportClick = async () => {
    setIsCreatingNewImportBatch(true);
    const selectedDocs = selectedDocumentKeys
      .map(key => importableDocuments.find(doc => doc.key === key));

    const batch = {
      hostName: selectedSource.hostName,
      documentsToImport: selectedDocs
    };

    try {
      const result = await importApiClient.postImportBatch(batch);
      setIsCreatingNewImportBatch(false);
      window.location = getImportDetailsUrl(result.batch._id);
    } catch (error) {
      handleApiError({ error, t });
    } finally {
      setIsCreatingNewImportBatch(false);
    }
  };

  useEffect(() => {
    const getDocuments = async () => {
      setIsFetchingImportableDocuments(true);

      setImportableDocuments([]);
      setSelectedDocumentKeys([]);

      try {
        const { documents } = await importApiClient.getImports(selectedSource.hostName);
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
    return <Tooltip title={t(doc.importType)} className="ImportBatchCreationPage-importType">{icon}</Tooltip>;
  };

  const renderTitle = doc => {
    if (!doc.slug) {
      return <span>{doc.title}</span>;
    }

    const baseUrl = getImportSourceBaseUrl(selectedSource);

    const url = `${baseUrl}${getArticleUrl(doc.slug)}`;
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
    <PageTemplate>
      <div className="ImportBatchCreationPage">
        <h1>{t('pageNames:importBatchCreation')}</h1>

        <h2> {t('source')}: {selectedSource?.name} </h2>
        <br /> <br />

        <Table
          bordered
          size="small"
          rowKey="key"
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
        <Button type="primary" disabled={!selectedDocumentKeys.length} loading={isCreatingNewImportBatch} onClick={handleImportClick}>
          {t('importButton')}
        </Button>
      </div>
    </PageTemplate>
  );
}

ImportBatchCreation.propTypes = {
  PageTemplate: PropTypes.func.isRequired
};
