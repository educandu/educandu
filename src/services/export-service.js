import by from 'thenby';
import httpErrors from 'http-errors';
import UserService from './user-service.js';
import DocumentService from './document-service.js';
import DocumentStore from '../stores/document-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import { DOCUMENT_ORIGIN } from '../common/constants.js';

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
  static get inject() { return [ServerConfig, DocumentStore, DocumentService, UserService]; }

  constructor(serverConfig, documentStore, documentService, userService) {
    this.serverConfig = serverConfig;
    this.documentStore = documentStore;
    this.documentService = documentService;
    this.userService = userService;
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

    const userIdSet = this.userService.extractUserIdSetFromDocsOrRevisions(revisionsToExport);
    const users = (await this.userService.getUsersByIds(Array.from(userIdSet)))
      .map(({ _id, username }) => ({ _id, username }));

    if (userIdSet.size !== users.length) {
      throw new Error(`Was searching for ${userIdSet.size} users in document ${key} before revision '${toRevision}', but found ${users.length}`);
    }

    return { revisions: revisionsToExport, users, cdnRootUrl: this.serverConfig.cdnRootUrl };
  }
}

export default ExportService;
