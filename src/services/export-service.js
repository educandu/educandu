import DocumentStore from '../stores/document-store.js';
import { DOCUMENT_ORIGIN } from '../common/constants.js';

const exportableDocumentsProjection = {
  key: 1,
  revision: 1,
  updatedOn: 1,
  title: 1,
  slug: 1,
  language: 1
};

const lastUpdatedFirst = [['updatedOn', -1]];

class ExportService {
  static get inject() {
    return [DocumentStore];
  }

  constructor(documentStore) {
    this.documentStore = documentStore;
  }

  getAllExportableDocumentsMetadata() {
    const filter = {
      archived: false,
      origin: DOCUMENT_ORIGIN.internal
    };

    return this.documentStore.find(filter, { sort: lastUpdatedFirst, projection: exportableDocumentsProjection });
  }
}

export default ExportService;
