import { Button } from 'antd';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { useService } from '../container-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import ClientConfig from '../../bootstrap/client-config.js';
import DocumentImportTable from '../document-import-table.js';
import { useSessionAwareApiClient } from '../../ui/api-helper.js';
import ImportApiClient from '../../api-clients/import-api-client.js';

export default function CreateImport({ initialState, PageTemplate }) {
  const { t } = useTranslation('createImport');
  const clientConfig = useService(ClientConfig);
  const importApiClient = useSessionAwareApiClient(ImportApiClient);
  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState([]);
  const [importableDocuments, setImportableDocuments] = useState([]);
  const [isFetchingImportableDocuments, setIsFetchingImportableDocuments] = useState(false);
  const [isCreatingNewImportBatch, setIsCreatingNewImportBatch] = useState(false);

  const importSource = clientConfig.importSources.find(source => source.hostName === initialState.importSourceHostName);
  const importSourceBaseUrl = urls.getImportSourceBaseUrl(importSource);

  const handleImportClick = async () => {
    setIsCreatingNewImportBatch(true);
    const documentsToImport = selectedDocumentKeys.map(key => importableDocuments.find(doc => doc.key === key));

    try {
      const result = await importApiClient.postImport({ hostName: importSource.hostName, documentsToImport });
      setIsCreatingNewImportBatch(false);
      window.location = urls.getBatchUrl(result.batch._id);
    } catch (error) {
      handleApiError({ error, t });
    } finally {
      setIsCreatingNewImportBatch(false);
    }
  };

  const renderImportButton = () => (
    <Button
      type="primary"
      className="CreateImportPage-importButton"
      disabled={!selectedDocumentKeys.length}
      loading={isCreatingNewImportBatch}
      onClick={handleImportClick}
      >
      {t('importButton')}
    </Button>
  );

  useEffect(() => {
    const getDocuments = async () => {
      setIsFetchingImportableDocuments(true);
      try {
        const { documents } = await importApiClient.getImports(importSource.hostName);
        setSelectedDocumentKeys([]);
        setImportableDocuments(documents);
      } catch (error) {
        handleApiError({ error, t });
      }
      setIsFetchingImportableDocuments(false);
    };

    getDocuments();

  }, [importApiClient, importSource.hostName, t]);

  return (
    <PageTemplate>
      <div className="CreateImportPage">
        <div><a href={urls.getImportsUrl()}>{t('backToImports')}</a></div>
        <h1>{t('pageNames:createImport')}</h1>
        <h2> {t('source')}: {importSource?.name} </h2>
        {renderImportButton()}
        <DocumentImportTable
          importableDocuments={importableDocuments}
          importSourceBaseUrl={importSourceBaseUrl}
          loading={isFetchingImportableDocuments}
          onSelectedKeysChange={setSelectedDocumentKeys}
          />
        {renderImportButton()}
      </div>
    </PageTemplate>
  );
}

CreateImport.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    importSourceHostName: PropTypes.string.isRequired
  }).isRequired
};
