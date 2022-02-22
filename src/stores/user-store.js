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

  findUser({ username, provider }, { session } = {}) {
    return this.findOne({ username, provider }, { session });
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
