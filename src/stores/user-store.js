import Database from './database.js';

class UserStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.users;
  }

  getAllUsers() {
    return this.collection.find().toArray();
  }

  findActiveUsersByEmail({ provider, email }, { session } = {}) {
    const queryFilters = [];

    if (email) {
      queryFilters.push({ email });
    }

    if (!queryFilters.length) {
      return [];
    }

    return this.collection
      .find({ $and: [{ provider }, { accountClosedOn: null }, { $or: queryFilters }] }, { session })
      .toArray();
  }

  findUserByVerificationCode({ provider, verificationCode }, { session } = {}) {
    return this.collection.findOne({ provider, verificationCode }, { session });
  }

  findActiveUserByProviderAndEmail({ provider, email }, { session } = {}) {
    return this.collection.findOne({ $and: [{ provider }, { email }, { accountClosedOn: null }] }, { session });
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

  saveUser(user, { session } = {}) {
    return this.collection.replaceOne({ _id: user._id }, user, { session, upsert: true });
  }

  addToUserFavorites({ userId, favoriteType, favoriteId, favoriteSetOn }, { session } = {}) {
    const favorite = { type: favoriteType, id: favoriteId, setOn: favoriteSetOn };
    return this.collection.updateOne({ _id: userId }, { $push: { favorites: favorite } }, { session });
  }

  removeFromUserFavorites({ userId, favoriteType, favoriteId }, { session } = {}) {
    const filter = { type: favoriteType, id: favoriteId };
    return this.collection.updateOne({ _id: userId }, { $pull: { favorites: filter } }, { session });
  }

  async checkUsersWithStoragePlanExistByStoragePlanId(storagePlanId, { session } = {}) {
    const matchingUser = await this.collection.findOne({ 'storage.plan': storagePlanId }, { session });
    return !!matchingUser;
  }
}

export default UserStore;
