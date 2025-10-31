import ServerConfig from '../bootstrap/server-config.js';
import DocumentRequestStore from '../stores/document-request-store.js';
import { addDays, dateToNumericDay, getDayOfWeek, getStartOfDay } from '../utils/date-utils.js';

class DocumentRequestService {
  static dependencies = [DocumentRequestStore, ServerConfig];

  constructor(documentRequestStore, serverConfig) {
    this.documentRequestStore = documentRequestStore;
    this.serverConfig = serverConfig;
  }

  async registerDocumentRequest({ document, documentRevision, user, isWriteRequest }) {
    if (document && documentRevision || (!document && !documentRevision)) {
      throw new Error('Either document or document revision must be provided');
    }

    if (document?.roomId || documentRevision?.roomId) {
      return;
    }

    const startOfDay = getStartOfDay(new Date());

    await this.documentRequestStore.incrementDocumentRequestCounters({
      documentId: documentRevision?.documentId ?? document._id,
      day: dateToNumericDay(startOfDay),
      dayOfWeek: getDayOfWeek(startOfDay),
      expiresOn: addDays(startOfDay, this.serverConfig.documentRequestExpiryTimeoutInDays + 1),
      increments: {
        totalCount: 1,
        readCount: isWriteRequest ? 0 : 1,
        writeCount: isWriteRequest ? 1 : 0,
        anonymousCount: user ? 0 : 1,
        loggedInCount: user ? 1 : 0
      }
    });
  }

  tryRegisterDocumentReadRequest({ document, user }) {
    return this.registerDocumentRequest({ document, documentRevision: null, user, isWriteRequest: false });
  }

  tryRegisterDocumentWriteRequest({ document, user }) {
    return this.registerDocumentRequest({ document, documentRevision: null, user, isWriteRequest: true });
  }

  tryRegisterDocumentRevisionReadRequest({ documentRevision, user }) {
    return this.registerDocumentRequest({ document: null, documentRevision, user, isWriteRequest: false });
  }
}

export default DocumentRequestService;
