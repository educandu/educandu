import { Button } from 'antd';
import PropTypes from 'prop-types';
import urls from '../../utils/urls.js';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { useService } from '../container-context.js';
import { handleApiError } from '../../ui/error-helper.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useGlobalAlerts } from '../../ui/global-alerts.js';
import { useReloadPersistedWindow } from '../../ui/hooks.js';
import DocumentImportTable from '../document-import-table.js';
import ImportApiClient from '../../services/import-api-client.js';

export default function ImportBatchCreation({ initialState, PageTemplate }) {
  useReloadPersistedWindow();
  const { t } = useTranslation('importBatchCreation');
  const clientConfig = useService(ClientConfig);
  const importApiClient = useService(ImportApiClient);
  const [selectedDocumentKeys, setSelectedDocumentKeys] = useState([]);
  const [importableDocuments, setImportableDocuments] = useState([]);
  const [isFetchingImportableDocuments, setIsFetchingImportableDocuments] = useState(false);
  const [isCreatingNewImportBatch, setIsCreatingNewImportBatch] = useState(false);

  const importSource = clientConfig.importSources.find(source => source.hostName === initialState.importSourceHostName);
  const importSourceBaseUrl = urls.getImportSourceBaseUrl(importSource);

  const handleImportClick = async () => {
    setIsCreatingNewImportBatch(true);
    const selectedDocs = selectedDocumentKeys
      .map(key => importableDocuments.find(doc => doc.key === key));

    const batch = {
      hostName: importSource.hostName,
      documentsToImport: selectedDocs
    };

    try {
      const result = await importApiClient.postImportBatch(batch);
      setIsCreatingNewImportBatch(false);
      window.location = urls.getImportDetailsUrl(result.batch._id);
    } catch (error) {
      handleApiError({ error, t });
    } finally {
      setIsCreatingNewImportBatch(false);
    }
  };

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

  const alerts = useGlobalAlerts();

  return (
    <PageTemplate alerts={alerts}>
      <div className="ImportBatchCreationPage">
        <div><a href="/import-batches">{t('backToImports')}</a></div>
        <h1>{t('pageNames:importBatchCreation')}</h1>
        <h2> {t('source')}: {importSource?.name} </h2>
        <br />
        <br />
        <DocumentImportTable
          importableDocuments={importableDocuments}
          importSourceBaseUrl={importSourceBaseUrl}
          loading={isFetchingImportableDocuments}
          onSelectedKeysChange={setSelectedDocumentKeys}
          />
        <br />
        <Button
          type="primary"
          disabled={!selectedDocumentKeys.length}
          loading={isCreatingNewImportBatch}
          onClick={handleImportClick}
          >
          {t('importButton')}
        </Button>
      </div>
    </PageTemplate>
  );
}

ImportBatchCreation.propTypes = {
  PageTemplate: PropTypes.func.isRequired,
  initialState: PropTypes.shape({
    importSourceHostName: PropTypes.string.isRequired
  }).isRequired
};
