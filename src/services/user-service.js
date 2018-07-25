const bcrypt = require('bcrypt');
const moment = require('moment');
const uniqueId = require('../utils/unique-id');
const UserStore = require('../stores/user-store');
const PasswordResetRequestStore = require('../stores/password-reset-request-store');

const ROLE_NAME_USER = 'user';
const PROVIDER_NAME_ELMU = 'elmu';
const PASSWORD_SALT_ROUNDS = 1024;
const PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS = 24;
const PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS = 24;

class UserService {
  static get inject() { return [UserStore, PasswordResetRequestStore]; }

  constructor(userStore, passwordResetRequestStore) {
    this.userStore = userStore;
    this.passwordResetRequestStore = passwordResetRequestStore;
  }

  getUserById(id) {
    return this.userStore.findOne({ query: { _id: id } });
  }

  getUserByEmailAddress(email, provider = PROVIDER_NAME_ELMU) {
    return this.userStore.findOne({ query: { email, provider } });
  }

  findUser(username, provider = PROVIDER_NAME_ELMU) {
    return this.userStore.findOne({ query: { username, provider } });
  }

  saveUser(user) {
    return this.userStore.save(user);
  }

  async createUser(username, password, email, provider = PROVIDER_NAME_ELMU) {
    const user = {
      _id: uniqueId.create(),
      provider: provider,
      username: username,
      passwordHash: await this._hashPassword(password),
      email: email,
      roles: [ROLE_NAME_USER],
      expires: moment.utc().add(PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS, 'hours').toDate(),
      verificationCode: uniqueId.create(),
      lockedOut: false
    };

    await this.saveUser(user);
    return user;
  }

  async verifyUser(verificationCode, provider = PROVIDER_NAME_ELMU) {
    try {
      const user = await this.userStore.findOne({ query: { verificationCode, provider } });
      if (user) {
        user.expires = null;
        user.verificationCode = null;
        await this.saveUser(user);
        return user;
      }
    } catch (err) {
      return false;
    }

    return false;
  }

  async authenticateUser(username, password, provider = PROVIDER_NAME_ELMU) {
    const user = await this.findUser(username, provider);
    if (!user || user.expires || user.lockedOut) {
      return false;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? user : false;
  }

  getPasswordResetRequestById(id) {
    return this.passwordResetRequestStore.findOne({ query: { _id: id } });
  }

  async createPasswordResetRequest(user) {
    if (user.provider !== PROVIDER_NAME_ELMU) {
      throw new Error('Cannot reset passwords on third party users');
    }

    const request = {
      _id: uniqueId.create(),
      userId: user._id,
      expires: moment.utc().add(PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS, 'hours').toDate()
    };

    await this.savePasswordResetRequest(request);
    return request;
  }

  async completePasswordResetRequest(passwordResetRequestId, password) {
    const request = await this.getPasswordResetRequestById(passwordResetRequestId);
    if (!request) {
      return false;
    }

    const user = await this.getUserById(request.userId);
    if (!user) {
      return false;
    }

    user.passwordHash = await this._hashPassword(password);

    await this.saveUser(user);
    return user;
  }

  savePasswordResetRequest(request) {
    return this.passwordResetRequestStore.save(request);
  }

  dbUserToClientUser(user) {
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      provider: user.provider,
      username: user.username,
      email: user.email,
      roles: user.roles
    };
  }

  _hashPassword(password) {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  }
}

module.exports = UserService;
