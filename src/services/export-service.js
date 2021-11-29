import by from 'thenby';
import httpErrors from 'http-errors';
import UserService from './user-service.js';
import DocumentService from './document-service.js';
import DocumentStore from '../stores/document-store.js';
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
  static get inject() { return [DocumentStore, DocumentService, UserService]; }

  constructor(documentStore, documentService, userService) {
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

  async getDocumentExport({ key, fromRevision, toRevision }) {
    const revisions = (await this.documentService.getAllDocumentRevisionsByKey(key)).sort(by(d => d.order));
    const firstRevisionIndex = fromRevision ? revisions.findIndex(revision => revision._id === fromRevision) : 0;
    const lastRevisionIndex = revisions.findIndex(revision => revision._id === toRevision);

    if (firstRevisionIndex === -1 || lastRevisionIndex === -1 || firstRevisionIndex > lastRevisionIndex) {
      throw new BadRequest(`The specified revision interval (${fromRevision} - ${toRevision}) is invalid for document ${key}`);
    }

    const revisionsToExport = revisions.slice(firstRevisionIndex, lastRevisionIndex + 1);

    const userIdSet = this.userService.extractUserIdSetFromDocsOrRevisions(revisionsToExport);
    const users = (await this.userService.getUsersByIds(Array.from(userIdSet)))
      .map(({ _id, username }) => ({ _id, username }));

    if (users.length !== userIdSet.size) {
      throw new Error(`Was searching for ${userIdSet.size} users in document ${key} between revisions ${fromRevision} - ${toRevision}, but found ${users.length}`);
    }

    return { revisions: revisionsToExport, users };
  }
}

export default ExportService;
