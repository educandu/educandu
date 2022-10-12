import by from 'thenby';
import UserStore from '../stores/user-store.js';
import DocumentStore from '../stores/document-store.js';
import ServerConfig from '../bootstrap/server-config.js';
import { DOCUMENT_ORIGIN } from '../domain/constants.js';
import DocumentRevisionStore from '../stores/document-revision-store.js';
import { extractUserIdsFromDocsOrRevisions } from '../domain/data-extractors.js';

class ExportService {
  static get inject() { return [ServerConfig, DocumentStore, DocumentRevisionStore, UserStore]; }

  constructor(serverConfig, documentStore, documentRevisionStore, userStore) {
    this.userStore = userStore;
    this.serverConfig = serverConfig;
    this.documentStore = documentStore;
    this.documentRevisionStore = documentRevisionStore;
  }

  async getAllExportableDocumentsMetadata() {
    return (await this.documentStore.getPublicNonArchivedDocumentsMetadataByOrigin(DOCUMENT_ORIGIN.internal))
      .sort(by(doc => doc.updatedOn, 'desc'));
  }

  async getDocumentExport({ documentId, includeEmails = false }) {
    const revisions = await this.documentRevisionStore.getAllDocumentRevisionsByDocumentId(documentId);

    const userIds = extractUserIdsFromDocsOrRevisions(revisions);
    const users = (await this.userStore.getUsersByIds(userIds))
      .map(({ _id, displayName, email }) => ({ _id, displayName, email: includeEmails ? email : null }));

    if (users.length !== userIds.length) {
      throw new Error(`Was searching for ${users.length} users in document ${documentId}, but found ${userIds.length}`);
    }

    return { revisions, users, cdnRootUrl: this.serverConfig.cdnRootUrl };
  }
}

export default ExportService;
