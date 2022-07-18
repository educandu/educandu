import by from 'thenby';
import urls from '../utils/routes.js';
import DocumentStore from '../stores/document-store.js';
import ExportApiClient from '../api-clients/export-api-client.js';
import { DOCUMENT_IMPORT_TYPE, DOCUMENT_ORIGIN } from '../domain/constants.js';

class ImportService {
  static get inject() {
    return [DocumentStore, ExportApiClient];
  }

  constructor(documentStore, exportApiClient) {
    this.documentStore = documentStore;
    this.exportApiClient = exportApiClient;
  }

  async _getAllImportedDocumentsMetadata(hostName) {
    const origin = `${DOCUMENT_ORIGIN.external}/${hostName}`;

    return (await this.documentStore.getPublicNonArchivedDocumentsMetadataByOrigin(origin))
      .sort(by(doc => doc.updatedOn, 'desc'));
  }

  async getAllImportableDocumentsMetadata(importSource) {
    const baseUrl = urls.getImportSourceBaseUrl(importSource);

    const exportApiClientResponse = await this.exportApiClient.getExports({ baseUrl, apiKey: importSource.apiKey });
    const exportableDocuments = exportApiClientResponse?.docs || [];
    const importedDocuments = await this._getAllImportedDocumentsMetadata(importSource.hostName);

    const importableDocuments = exportableDocuments
      .map(exportableDocument => {
        const importedDocument = importedDocuments.find(document => document._id === exportableDocument._id);

        let importType;

        if (importedDocument) {
          importType = importedDocument.revision === exportableDocument.revision
            ? DOCUMENT_IMPORT_TYPE.reimport
            : DOCUMENT_IMPORT_TYPE.update;
        } else {
          importType = DOCUMENT_IMPORT_TYPE.add;
        }

        return {
          _id: exportableDocument._id,
          title: exportableDocument.title,
          slug: exportableDocument.slug,
          language: exportableDocument.language,
          updatedOn: exportableDocument.updatedOn,
          importedRevision: importedDocument?.revision || null,
          importableRevision: exportableDocument.revision,
          importType
        };
      })
      .filter(importableDocument => importableDocument);

    return importableDocuments;
  }
}

export default ImportService;
