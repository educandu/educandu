import Database from './database.js';
import { validate } from '../domain/validation.js';
import { favoriteDBSchema, userDBSchema } from '../domain/schemas/user-schemas.js';

class UserStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.users;
  }

  getAllUsers() {
    return this.collection.find().toArray();
  }

  findUserByVerificationCode(verificationCode, { session } = {}) {
    return this.collection.findOne({ verificationCode }, { session });
  }

  findActiveUserByEmail(email, { session } = {}) {
    return this.collection.findOne({ $and: [{ email }, { accountClosedOn: null }] }, { session });
  }

  getUserById(id, { session } = {}) {
    return this.collection.findOne({ _id: id }, { session });
  }

  getUsersByIds(ids, { session } = {}) {
    return ids.length
      ? this.collection.find({ _id: { $in: ids } }, { session }).toArray()
      : Promise.resolve([]);
  }

  getActiveUserByEmailAddress(email, { session } = {}) {
    return this.collection.findOne({ email, accountClosedOn: null }, { session });
  }

  getUsersByEmailAddress(email, { session } = {}) {
    return this.collection.find({ email }, { session }).toArray();
  }

  saveUser(user, { session } = {}) {
    validate(user, userDBSchema);
    return this.collection.replaceOne({ _id: user._id }, user, { session, upsert: true });
  }

  async updateUserLastLoggedInOn({ userId, lastLoggedInOn }, { session } = {}) {
    const filter = { _id: userId };
    const update = { $set: { lastLoggedInOn } };
    const options = { session, returnDocument: 'after' };

    const { value } = await this.collection.findOneAndUpdate(filter, update, options);

    validate(value, userDBSchema);
    return value;
  }

  addToUserFavorites({ userId, favoriteType, favoriteId, favoriteSetOn }, { session } = {}) {
    const favorite = { type: favoriteType, id: favoriteId, setOn: favoriteSetOn };
    validate(favorite, favoriteDBSchema);
    return this.collection.updateOne({ _id: userId }, { $push: { favorites: favorite } }, { session });
  }

  removeFromUserFavorites({ userId, favoriteType, favoriteId }, { session } = {}) {
    const filter = { type: favoriteType, id: favoriteId };
    return this.collection.updateOne({ _id: userId }, { $pull: { favorites: filter } }, { session });
  }

  async checkUsersWithStoragePlanExistByStoragePlanId(storagePlanId, { session } = {}) {
    const matchingUser = await this.collection.findOne({ 'storage.planId': storagePlanId }, { session });
    return !!matchingUser;
  }
}

export default UserStore;
