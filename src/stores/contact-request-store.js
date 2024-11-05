import Database from './database.js';
import { validate } from '../domain/validation.js';
import { contactRequestDbSchema } from '../domain/schemas/contact-request-schemas.js';

class ContactRequestStore {
  static dependencies = [Database];

  constructor(db) {
    this.collection = db.contactRequests;
  }

  getContactRequestFromUserToUser({ fromUserId, toUserId }, { session } = {}) {
    return this.collection.findOne({ fromUserId, toUserId }, { session });
  }

  saveContactRequest(contactRequest, { session } = {}) {
    validate(contactRequest, contactRequestDbSchema);
    return this.collection.replaceOne({ _id: contactRequest._id }, contactRequest, { session, upsert: true });
  }
}

export default ContactRequestStore;
