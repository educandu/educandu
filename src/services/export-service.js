import by from 'thenby';
import httpErrors from 'http-errors';
import UserStore from '../stores/user-store.js';
import DocumentService from './document-service.js';
import DocumentStore from '../stores/document-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import { DOCUMENT_ORIGIN } from '../domain/constants.js';
import { extractUserIdsFromDocsOrRevisions } from '../domain/data-extractors.js';

const { BadRequest } = httpErrors;

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
  static get inject() { return [ServerConfig, DocumentStore, UserStore, DocumentService]; }

  constructor(serverConfig, documentStore, userStore, documentService) {
    this.userStore = userStore;
    this.serverConfig = serverConfig;
    this.documentStore = documentStore;
    this.documentService = documentService;
  }

  getAllExportableDocumentsMetadata() {
    const filter = {
      archived: false,
      origin: DOCUMENT_ORIGIN.internal
    };

    return this.documentStore.find(filter, { sort: lastUpdatedFirst, projection: exportableDocumentsProjection });
  }

  async getDocumentExport({ key, toRevision }) {
    const revisions = (await this.documentService.getAllDocumentRevisionsByKey(key)).sort(by(d => d.order));
    const lastRevisionIndex = revisions.findIndex(revision => revision._id === toRevision);

    if (lastRevisionIndex === -1) {
      throw new BadRequest(`The specified revision '${toRevision}' is invalid for document '${key}'`);
    }

    const revisionsToExport = revisions.slice(0, lastRevisionIndex + 1);

    const userIds = extractUserIdsFromDocsOrRevisions(revisionsToExport);
    const users = (await this.userStore.getUsersByIds(userIds))
      .map(({ _id, username }) => ({ _id, username }));

    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${users.length} users in document ${key} up to revision '${toRevision}', but found ${userIds.length}`);
    }

    return { revisions: revisionsToExport, users, cdnRootUrl: this.serverConfig.cdnRootUrl };
  }
}

export default ExportService;
