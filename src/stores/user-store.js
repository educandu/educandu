import Database from './database.js';

class UserStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.users;
  }

  getAllUsers() {
    return this.collection.find().toArray();
  }

  async findUserByLogin({ provider, emailOrUsername }, { session } = {}) {
    const matches = await this.collection.find({
      $and: [
        { provider },
        { $or: [{ username: emailOrUsername }, { email: emailOrUsername }] }
      ]
    }, {
      session
    }).toArray();

    switch (matches.length) {
      case 0:
        return null;
      case 1:
        return matches[0];
      default:
        // Always prefer matching emails over usernames:
        return matches.find(match => match.email === emailOrUsername);
    }
  }

  findUserByVerificationCode({ provider, verificationCode }, { session } = {}) {
    return this.collection.findOne({ provider, verificationCode }, { session });
  }

  findUserByUsernameOrEmail({ provider, username, email }, { session } = {}) {
    return this.collection.findOne({
      $and: [
        { provider },
        { $or: [{ username }, { email }] }
      ]
    }, { session });
  }

  findDifferentUserByUsernameOrEmail({ userId, provider, username, email }, { session } = {}) {
    return this.collection.findOne({
      $and: [
        { _id: { $ne: userId } },
        { provider },
        { $or: [{ username }, { email }] }
      ]
    }, { session });
  }

  getUserById(id, { session } = {}) {
    return this.collection.findOne({ _id: id }, { session });
  }

  getUsersByIds(ids, { session } = {}) {
    return ids.length
      ? this.collection.find({ _id: { $in: ids } }, { session }).toArray()
      : Promise.resolve([]);
  }

  getUserByEmailAddress(email, { session } = {}) {
    return this.collection.findOne({ email: email.toLowerCase() }, { session });
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
}

export default UserStore;
