import uniqueId from '../utils/unique-id.js';
import DocumentRequestStore from '../stores/document-request-store.js';
import { DOCUMENT_REQUEST_TYPE, DAY_OF_WEEK } from '../domain/constants.js';

class DocumentRequestService {
  static dependencies = [DocumentRequestStore];

  constructor(documentRequestStore) {
    this.documentRequestStore = documentRequestStore;
  }

  getDayOfWeek(date) {
    const day = date.getDay();
    switch (day) {
      case 0:
        return DAY_OF_WEEK.sunday;
      case 1:
        return DAY_OF_WEEK.monday;
      case 2:
        return DAY_OF_WEEK.tuesday;
      case 3:
        return DAY_OF_WEEK.wednesday;
      case 4:
        return DAY_OF_WEEK.thursday;
      case 5:
        return DAY_OF_WEEK.friday;
      case 6:
        return DAY_OF_WEEK.saturday;
      default:
        return null;
    }
  }

  async createDocumentRequest({ document, user, type }) {
    const createdOn = new Date();

    if (document.roomId) {
      return null;
    }

    const newDocumentRequest = {
      _id: uniqueId.create(),
      documentId: document._id,
      documentRevisionId: document.revision,
      type,
      loggedInUser: !!user,
      createdOn,
      createdOnDayOfWeek: this.getDayOfWeek(createdOn),
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
