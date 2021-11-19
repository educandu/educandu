import ExportApiClient from './export-api-client.js';
import DocumentStore from '../stores/document-store.js';
import { DOCUMENT_IMPORT_TYPE } from '../common/constants.js';

const importedDocumentsProjection = {
  key: 1,
  revision: 1,
  updatedOn: 1,
  title: 1,
  slug: 1,
  language: 1
};

const lastUpdatedFirst = [['updatedOn', -1]];

class ImportService {
  static get inject() {
    return [DocumentStore, ExportApiClient];
  }

  constructor(documentStore, exportApiClient) {
    this.documentStore = documentStore;
    this.exportApiClient = exportApiClient;
  }

  getAllImportedDocumentsMetadata(origin) {
    const filter = { archived: false, origin };
    return this.documentStore.find(filter, { sort: lastUpdatedFirst, projection: importedDocumentsProjection });
  }

  async getAllImportableDocumentsMetadata(importSource) {
    const { baseUrl, apiKey } = importSource;

    const exportableDocuments = await this.exportApiClient.getExportableDocumentsMetadata({ baseUrl, apiKey });
    const importedDocuments = await this.getAllImportedDocumentsMetadata(importSource.name);

    const importableDocuments = exportableDocuments
      .map(exportableDocument => {
        const importedDocument = importedDocuments.find(document => document.key === exportableDocument.key);

        if (importedDocument?.revision === exportableDocument.revision) {
          return null;
        }

        return {
          ...exportableDocument,
          importType: importedDocument ? DOCUMENT_IMPORT_TYPE.update : DOCUMENT_IMPORT_TYPE.add
        };
      })
      .filter(importableDocument => importableDocument);

    return importableDocuments;
  }
}

export default ImportService;
