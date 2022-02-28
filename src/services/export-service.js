import by from 'thenby';
import httpErrors from 'http-errors';
import UserStore from '../stores/user-store.js';
import DocumentStore from '../stores/document-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import { DOCUMENT_ORIGIN } from '../domain/constants.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { extractUserIdsFromDocsOrRevisions } from '../domain/data-extractors.js';

const { BadRequest } = httpErrors;

class ExportService {
  static get inject() { return [ServerConfig, DocumentStore, DocumentRevisionStore, UserStore]; }

  constructor(serverConfig, documentStore, documentRevisionStore, userStore) {
    this.userStore = userStore;
    this.serverConfig = serverConfig;
    this.documentStore = documentStore;
    this.documentRevisionStore = documentRevisionStore;
  }

  async getAllExportableDocumentsMetadata() {
    return (await this.documentStore.getNonArchivedDocumentsMetadataByOrigin(DOCUMENT_ORIGIN.internal))
      .sort(by(doc => doc.updatedOn, 'desc'));
  }

  async getDocumentExport({ key, toRevision }) {
    const revisions = await this.documentRevisionStore.getAllDocumentRevisionsByKey(key);
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
