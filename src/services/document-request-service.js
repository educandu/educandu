import { ObjectId } from 'mongodb';
import ServerConfig from '../bootstrap/server-config.js';
import DocumentRequestStore from '../stores/document-request-store.js';
import DailyDocumentRequestStore from '../stores/daily-document-request-store.js';
import { addDays, dateToNumericDay, getDayOfWeek, getStartOfDay } from '../utils/date-utils.js';

class DocumentRequestService {
  static dependencies = [DocumentRequestStore, DailyDocumentRequestStore, ServerConfig];

  constructor(documentRequestStore, dailyDocumentRequestStore, serverConfig) {
    this.documentRequestStore = documentRequestStore;
    this.dailyDocumentRequestStore = dailyDocumentRequestStore;
    this.serverConfig = serverConfig;
  }

  async registerDailyDocumentRequest({ document, documentRevision, user, isWriteRequest }) {
    if (document && documentRevision || (!document && !documentRevision)) {
      throw new Error('Either document or document revision must be provided');
    }

    if (document?.roomId || documentRevision?.roomId) {
      return;
    }

    const startOfDay = getStartOfDay(new Date());

    await this.dailyDocumentRequestStore.incrementDailyDocumentRequestCounters({
      documentId: documentRevision?.documentId ?? document._id,
      day: dateToNumericDay(startOfDay),
      dayOfWeek: getDayOfWeek(startOfDay),
      expiresOn: addDays(startOfDay, this.serverConfig.dailyDocumentRequestExpiryTimeoutInDays + 1),
      increments: {
        totalCount: 1,
        readCount: isWriteRequest ? 0 : 1,
        writeCount: isWriteRequest ? 1 : 0,
        anonymousCount: user ? 0 : 1,
        loggedInCount: user ? 1 : 0
      }
    });
  }

  async _createDocumentRequest({ document, user, isWriteRequest }) {
    await this.registerDailyDocumentRequest({ document, documentRevision: null, user, isWriteRequest });

    const registeredOn = new Date();

    if (document.roomId) {
      return null;
    }

    const newDocumentRequest = {
      _id: new ObjectId(),
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
    return this._createDocumentRequest({ document, user, isWriteRequest: false });
  }

  tryRegisterDocumentWriteRequest({ document, user }) {
    return this._createDocumentRequest({ document, user, isWriteRequest: true });
  }

  async tryRegisterDocumentRevisionReadRequest({ documentRevision, user }) {
    await this.registerDailyDocumentRequest({ document: null, documentRevision, user, isWriteRequest: false });

    const registeredOn = new Date();

    if (documentRevision.roomId) {
      return null;
    }

    const newDocumentRequest = {
      _id: new ObjectId(),
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
