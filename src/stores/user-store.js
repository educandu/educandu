import Database from './database.js';
import StoreBase from './store-base.js';

class UserStore extends StoreBase {
  static get inject() { return [Database]; }

  constructor(db) {
    super(db.users);
  }

  getAllUsers() {
    return this.find();
  }

  findUserByUsername({ provider, username }, { session } = {}) {
    return this.findOne({ username, provider }, { session });
  }

  findUserByVerificationCode({ provider, verificationCode }, { session } = {}) {
    return this.findOne({ provider, verificationCode }, { session });
  }

  findUserByUsernameOrEmail({ provider, username, email }, { session } = {}) {
    return this.findOne({
      $and: [
        { provider },
        { $or: [{ username }, { email }] }
      ]
    }, { session });
  }

  findDifferentUserByUsernameOrEmail({ userId, provider, username, email }, { session } = {}) {
    return this.findOne({
      $and: [
        { _id: { $ne: userId } },
        { provider },
        { $or: [{ username }, { email }] }
      ]
    }, { session });
  }

  getUserById(id, { session } = {}) {
    return this.findOne({ _id: id }, { session });
  }

  getUsersByIds(ids, { session } = {}) {
    return ids.length ? this.find({ _id: { $in: ids } }, { session }) : Promise.resolve([]);
  }

  getUserByEmailAddress(email, { session } = {}) {
    return this.findOne({ email: email.toLowerCase() }, { session });
  }

  saveUser(user, { session } = {}) {
    return this.save(user, { session });
  }
}

export default UserStore;
