import Database from './database.js';
import uniqueId from '../utils/unique-id.js';
import { validate } from '../domain/validation.js';
import { externalAccountDbSchema } from '../domain/schemas/external-account-schemas.js';

class ExternalAccountStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.externalAccounts;
  }

  saveExternalAccount(externalAccount, { session } = {}) {
    validate(externalAccount, externalAccountDbSchema);
    return this.collection.replaceOne({ _id: externalAccount._id }, externalAccount, { session, upsert: true });
  }

  async createOrUpdateExternalAccountByProviderKeyAndExternalUserId({ providerKey, externalUserId, lastLoggedInOn, expiresOn }, { session } = {}) {
    const filter = { providerKey, externalUserId };

    const update = {
      $set: { lastLoggedInOn, expiresOn },
      $setOnInsert: { _id: uniqueId.create(), providerKey, externalUserId, userId: null }
    };

    const options = { session, upsert: true, returnDocument: 'after' };

    const { value } = await this.collection.findOneAndUpdate(filter, update, options);

    validate(value, externalAccountDbSchema);
    return value;
  }

  async updateExternalAccountUserId({ externalAccountId, userId }, { session } = {}) {
    const filter = { _id: externalAccountId };
    const update = { $set: { userId } };
    const options = { session, returnDocument: 'after' };

    const { value } = await this.collection.findOneAndUpdate(filter, update, options);

    validate(value, externalAccountDbSchema);
    return value;
  }
}

export default ExternalAccountStore;
