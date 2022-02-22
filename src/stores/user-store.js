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

  findUser({ username, provider }) {
    return this.findOne({ username, provider });
  }

  getUserById(id) {
    return this.findOne({ _id: id });
  }

  getUsersByIds(ids) {
    return ids.length ? this.find({ _id: { $in: ids } }) : Promise.resolve([]);
  }

  getUserByEmailAddress(email) {
    return this.findOne({ email: email.toLowerCase() });
  }

  saveUser(user) {
    return this.save(user);
  }
}

export default UserStore;
