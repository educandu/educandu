import Database from './database.js';
class UserStore {
  static get inject() { return [Database]; }

  constructor(db) {
    this.collection = db.users;
  }

  getAllUsers() {
    return this.collection.find().toArray();
  }

  findUserByUsername({ provider, username }, { session } = {}) {
    return this.collection.findOne({ username, provider }, { session });
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
}

export default UserStore;
