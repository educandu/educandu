import UserService from './user-service.js';
import DocumentStore from '../stores/document-store.js';
import { DOCUMENT_IMPORT_TYPE, DOCUMENT_ORIGIN } from '../common/constants.js';
import DocumentLockStore from '../stores/document-lock-store.js';
import DocumentOrderStore from '../stores/document-order-store.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';

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
    return [DocumentRevisionStore, DocumentOrderStore, DocumentLockStore, DocumentStore, UserService];
  }

  constructor(documentRevisionStore, documentOrderStore, documentLockStore, documentStore, userService) {
    this.documentRevisionStore = documentRevisionStore;
    this.documentOrderStore = documentOrderStore;
    this.documentLockStore = documentLockStore;
    this.documentStore = documentStore;
    this.userService = userService;
  }

  getAllImportedDocumentsMetadata() {
    const filter = {
      archived: false,
      origin: { $ne: DOCUMENT_ORIGIN.internal }
    };

    return this.documentStore.find(filter, { sort: lastUpdatedFirst, projection: importedDocumentsProjection });
  }

  async getAllImportableDocumentsMetadata(exportableDocuments) {
    const importedDocuments = await this.getAllImportedDocumentsMetadata();

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
