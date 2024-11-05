import moment from 'moment/moment.js';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import ContactRequestStore from '../stores/contact-request-store.js';
import { CONTACT_REQUEST_EXPIRATION_IN_DAYS } from '../domain/constants.js';

const logger = new Logger(import.meta.url);

class ContactRequestService {
  static dependencies = [ContactRequestStore];

  constructor(contactRequestStore) {
    this.contactRequestStore = contactRequestStore;
  }

  getContactRequestFromUserToUser({ fromUserId, toUserId }) {
    return this.contactRequestStore.getContactRequestFromUserToUser({ fromUserId, toUserId });
  }

  async createContactRequest({ fromUserId, toUserId, contactEmailAddress }) {
    const existingContactRequest = await this.contactRequestStore.getContactRequestFromUserToUser({ fromUserId, toUserId });
    if (existingContactRequest) {
      throw new Error(`Contact request from user ${fromUserId} to user ${toUserId} already exists!`);
    }

    const now = new Date();
    const contactRequest = {
      _id: uniqueId.create(),
      fromUserId,
      toUserId,
      contactEmailAddress,
      createdOn: now,
      expiresOn: moment(now).add(CONTACT_REQUEST_EXPIRATION_IN_DAYS, 'days').toDate()
    };

    logger.info(`Creating new contact request with _id ${contactRequest._id} `);

    await this.contactRequestStore.saveContactRequest(contactRequest);

    return contactRequest;
  }
}

export default ContactRequestService;
