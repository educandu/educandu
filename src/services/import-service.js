import ExportApiClient from './export-api-client.js';
import DocumentStore from '../stores/document-store.js';
import { DOCUMENT_IMPORT_TYPE, DOCUMENT_ORIGIN } from '../common/constants.js';

const importedDocumentsProjection = {
  key: 1,
  revision: 1,
  updatedOn: 1,
  title: 1,
  slug: 1,
  language: 1
};

const lastUpdatedFirst = [['updatedOn', -1]];

const mockImportedDocuments = [
  {
    key: 'aZhbdGbTAt1435U5tswQNo',
    order: 1,
    revision: 'rABF765a1tvZJvM5yJNjfU',
    updatedOn: new Date('2021-11-19T09:25:07.426Z'),
    title: 'Document 1',
    slug: 'doc-1',
    language: 'de'
  }
];
class ImportService {
  static get inject() {
    return [DocumentStore, ExportApiClient];
  }

  constructor(documentStore, exportApiClient) {
    this.documentStore = documentStore;
    this.exportApiClient = exportApiClient;
  }

  getAllImportedDocumentsMetadata(importDomain) {
    const filter = { archived: false, origin: `${DOCUMENT_ORIGIN.external}/${importDomain}` };
    return this.documentStore.find(filter, { sort: lastUpdatedFirst, projection: importedDocumentsProjection });
  }

  async getAllImportableDocumentsMetadata(importSource, useMockData) {
    const { baseUrl, apiKey } = importSource;
    const importDomain = new URL(baseUrl).hostname;

    const exportableDocuments = await this.exportApiClient.getExports({ baseUrl, apiKey });
    const importedDocuments = useMockData ? mockImportedDocuments : await this.getAllImportedDocumentsMetadata(importDomain);

    const importableDocuments = exportableDocuments
      .map(exportableDocument => {
        const importedDocument = importedDocuments.find(document => document.key === exportableDocument.key);

        if (importedDocument?.revision === exportableDocument.revision) {
          return null;
        }

        return {
          key: exportableDocument.key,
          title: exportableDocument.title,
          slug: exportableDocument.slug,
          language: exportableDocument.language,
          updatedOn: exportableDocument.updatedOn,
          importedRevision: importedDocument?.revision || null,
          importableRevision: exportableDocument.revision,
          importType: importedDocument ? DOCUMENT_IMPORT_TYPE.update : DOCUMENT_IMPORT_TYPE.add
        };
      })
      .filter(importableDocument => importableDocument);

    return importableDocuments;
  }
}

export default ImportService;
