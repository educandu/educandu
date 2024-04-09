import uniqueId from '../utils/unique-id.js';
import { getDayOfWeek } from '../utils/date-utils.js';
import DocumentRequestStore from '../stores/document-request-store.js';

class DocumentRequestService {
  static dependencies = [DocumentRequestStore];

  constructor(documentRequestStore) {
    this.documentRequestStore = documentRequestStore;
  }

  getAllDocumentRequestCounters() {
    return this.documentRequestStore.getAllDocumentRequestCounters();
  }

  async createDocumentRequest({ document, user, isWriteRequest }) {
    const registeredOn = new Date();

    if (document.roomId) {
      return null;
    }

    const newDocumentRequest = {
      _id: uniqueId.create(),
      documentId: document._id,
      documentRevisionId: document.revision,
      isWriteRequest,
      isLoggedInRequest: !!user,
      registeredOn,
      registeredOnDayOfWeek: getDayOfWeek(registeredOn),
    };

    await this.documentRequestStore.saveDocumentRequest(newDocumentRequest);

    return newDocumentRequest;
  }

  tryRegisterDocumentReadRequest({ document, user }) {
    return this.createDocumentRequest({ document, user, isWriteRequest: false });
  }

  tryRegisterDocumentWriteRequest({ document, user }) {
    return this.createDocumentRequest({ document, user, isWriteRequest: true });
  }

  async tryRegisterDocumentRevisionReadRequest({ documentRevision, user }) {
    const registeredOn = new Date();

    if (documentRevision.roomId) {
      return null;
    }

    const newDocumentRequest = {
      _id: uniqueId.create(),
      documentId: documentRevision.documentId,
      documentRevisionId: documentRevision._id,
      isWriteRequest: false,
      isLoggedInRequest: !!user,
      registeredOn,
      registeredOnDayOfWeek: getDayOfWeek(registeredOn),
    };

    await this.documentRequestStore.saveDocumentRequest(newDocumentRequest);

    return newDocumentRequest;
  }
}

export default DocumentRequestService;
