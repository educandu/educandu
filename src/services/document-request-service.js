import uniqueId from '../utils/unique-id.js';
import { getDayOfWeek } from '../utils/date-utils.js';
import DocumentRequestStore from '../stores/document-request-store.js';

class DocumentRequestService {
  static dependencies = [DocumentRequestStore];

  constructor(documentRequestStore) {
    this.documentRequestStore = documentRequestStore;
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

  tryRegisterReadRequest({ document, user }) {
    return this.createDocumentRequest({ document, user, isWriteRequest: false });
  }

  tryRegisterWriteRequest({ document, user }) {
    return this.createDocumentRequest({ document, user, isWriteRequest: true });
  }
}

export default DocumentRequestService;
