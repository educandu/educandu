import uniqueId from '../utils/unique-id.js';
import { getDayOfWeek } from '../utils/date-utils.js';
import { DOCUMENT_REQUEST_TYPE } from '../domain/constants.js';
import DocumentRequestStore from '../stores/document-request-store.js';

class DocumentRequestService {
  static dependencies = [DocumentRequestStore];

  constructor(documentRequestStore) {
    this.documentRequestStore = documentRequestStore;
  }

  async createDocumentRequest({ document, user, type }) {
    const registeredOn = new Date();

    if (document.roomId) {
      return null;
    }

    const newDocumentRequest = {
      _id: uniqueId.create(),
      documentId: document._id,
      documentRevisionId: document.revision,
      type,
      isUserLoggedIn: !!user,
      registeredOn,
      registeredOnDayOfWeek: getDayOfWeek(registeredOn),
    };

    await this.documentRequestStore.saveDocumentRequest(newDocumentRequest);

    return newDocumentRequest;
  }

  tryRegisterReadRequest({ document, user }) {
    return this.createDocumentRequest({ document, user, type: DOCUMENT_REQUEST_TYPE.read });
  }

  tryRegisterWriteRequest({ document, user }) {
    return this.createDocumentRequest({ document, user, type: DOCUMENT_REQUEST_TYPE.write });
  }
}

export default DocumentRequestService;
