import bcrypt from 'bcrypt';
import { add } from 'date-fns';
import { ROLE } from '../domain/role.js';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import UserStore from '../stores/user-store.js';
import { SAVE_USER_RESULT } from '../domain/user-management.js';
import PasswordResetRequestStore from '../stores/password-reset-request-store.js';

const DEFAULT_ROLE_NAME = ROLE.user;
const DEFAULT_PROVIDER_NAME = 'educandu';
const PASSWORD_SALT_ROUNDS = 1024;
const PENDING_USER_REGISTRATION_EXPIRATION_TIMESPAN = { hours: 24 };
const PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_TIMESPAN = { hours: 24 };

const logger = new Logger(import.meta.url);

class UserService {
  static get inject() { return [UserStore, PasswordResetRequestStore]; }

  constructor(userStore, passwordResetRequestStore) {
    this.userStore = userStore;
    this.passwordResetRequestStore = passwordResetRequestStore;
  }

  getAllUsers() {
    return this.userStore.find();
  }

  getUserById(id) {
    return this.userStore.findOne({ _id: id });
  }

  getUsersByIds(ids) {
    return ids.length
      ? this.userStore.find({ _id: { $in: ids } })
      : Promise.resolve([]);
  }

  getUserByEmailAddress(email, provider = DEFAULT_PROVIDER_NAME) {
    return this.userStore.findOne({ email: email.toLowerCase(), provider });
  }

  extractUserIdSetFromDocsOrRevisions(docsOrRevisions) {
    return docsOrRevisions.reduce((set, docOrRev) => this._fillUserIdSetForDocOrRevision(docOrRev, set), new Set());
  }

  _fillUserIdSetForDocOrRevision(docOrRev, set) {
    if (docOrRev.createdBy) {
      set.add(docOrRev.createdBy);
    }
    if (docOrRev.updatedBy) {
      set.add(docOrRev.updatedBy);
    }
    if (docOrRev.contributors) {
      docOrRev.contributors.forEach(c => set.add(c));
    }
    if (docOrRev.sections) {
      docOrRev.sections.forEach(s => {
        if (s.deletedBy) {
          set.add(s.deletedBy);
        }
      });
    }
    return set;
  }

  findUser(username, provider = DEFAULT_PROVIDER_NAME) {
    return this.userStore.findOne({ username, provider });
  }

  saveUser(user) {
    logger.info(`Saving user with id ${user._id}`);
    return this.userStore.save(user);
  }

  async updateUserAccount({ userId, provider, username, email }) {
    logger.info(`Updating account data for user with id ${userId}`);
    const lowerCasedEmail = email.toLowerCase();

    const otherExistingUser = await this.userStore.findOne({
      $and: [
        { _id: { $ne: userId } },
        { provider },
        { $or: [{ username }, { email: lowerCasedEmail }] }
      ]
    });

    if (otherExistingUser) {
      return otherExistingUser.email === lowerCasedEmail
        ? { result: SAVE_USER_RESULT.duplicateEmail, user: null }
        : { result: SAVE_USER_RESULT.duplicateUsername, user: null };
    }

    const user = await this.getUserById(userId);
    const updatedUser = { ...user, username, email: lowerCasedEmail };

    await this.saveUser(updatedUser);
    return { result: SAVE_USER_RESULT.success, user: updatedUser };
  }

  async updateUserProfile(userId, newProfile) {
    logger.info(`Updating profile for user with id ${userId}`);
    const user = await this.getUserById(userId);
    user.profile = newProfile;
    await this.saveUser(user);
    return user.profile;
  }

  async updateUserRoles(userId, newRoles) {
    logger.info(`Updating roles for user with id ${userId}: ${newRoles}`);
    const user = await this.getUserById(userId);
    const roleSet = new Set(newRoles || []);
    roleSet.add(DEFAULT_ROLE_NAME);
    user.roles = Array.from(roleSet.values());
    await this.saveUser(user);
    return user.roles;
  }

  async updateUserLockedOutState(userId, lockedOut) {
    logger.info(`Updating locked out state for user with id ${userId}: ${lockedOut}`);
    const user = await this.getUserById(userId);
    user.lockedOut = lockedOut;
    await this.saveUser(user);
    return user.lockedOut;
  }

  async createUser({ username, password, email, provider = DEFAULT_PROVIDER_NAME, roles = [DEFAULT_ROLE_NAME], verified = false }) {
    const lowerCasedEmail = email.toLowerCase();

    const existingUser = await this.userStore.findOne({ $or: [{ username }, { email: lowerCasedEmail }] });
    if (existingUser) {
      return existingUser.email === lowerCasedEmail
        ? { result: SAVE_USER_RESULT.duplicateEmail, user: null }
        : { result: SAVE_USER_RESULT.duplicateUsername, user: null };
    }

    const user = this._buildEmptyUser();
    user.provider = provider;
    user.username = username;
    user.passwordHash = await this._hashPassword(password);
    user.email = lowerCasedEmail;
    user.roles = roles;
    user.expires = verified ? null : add(new Date(), PENDING_USER_REGISTRATION_EXPIRATION_TIMESPAN);
    user.verificationCode = verified ? null : uniqueId.create();

    logger.info(`Creating new user with id ${user._id}`);
    await this.saveUser(user);
    return { result: SAVE_USER_RESULT.success, user };
  }

  async ensureExternalUser({ _id, username, hostName }) {
    const user = {
      ...this._buildEmptyUser(),
      _id,
      username,
      provider: `external/${hostName}`
    };
    await this.saveUser(user);
  }

  async verifyUser(verificationCode, provider = DEFAULT_PROVIDER_NAME) {
    logger.info(`Verifying user with verification code ${verificationCode}`);
    let user = null;
    try {
      user = await this.userStore.findOne({ verificationCode, provider });
      if (user) {
        logger.info(`Found user with id ${user._id}`);
        user.expires = null;
        user.verificationCode = null;
        await this.saveUser(user);
      } else {
        logger.info(`No user found for verification code ${verificationCode}`);
      }
    } catch (err) {
      logger.fatal(err);
    }

    return user;
  }

  async authenticateUser(username, password, provider = DEFAULT_PROVIDER_NAME) {
    const user = await this.findUser(username, provider);
    if (!user || user.expires || user.lockedOut) {
      return false;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? user : false;
  }

  getPasswordResetRequestById(id) {
    return this.passwordResetRequestStore.findOne({ _id: id });
  }

  deletePasswordResetRequestById(id) {
    return this.passwordResetRequestStore.deleteOne({ _id: id });
  }

  async createPasswordResetRequest(user) {
    if (user.provider !== DEFAULT_PROVIDER_NAME) {
      throw new Error('Cannot reset passwords on third party users');
    }

    const request = {
      _id: uniqueId.create(),
      userId: user._id,
      expires: add(new Date(), PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_TIMESPAN)
    };

    logger.info(`Creating password reset request ${request._id} for user with id ${request.userId}`);
    await this.savePasswordResetRequest(request);
    return request;
  }

  async completePasswordResetRequest(passwordResetRequestId, password) {
    logger.info(`Completing password reset request ${passwordResetRequestId}`);
    const request = await this.getPasswordResetRequestById(passwordResetRequestId);
    if (!request) {
      logger.info(`No password reset request has been found for id ${passwordResetRequestId}. Aborting request`);
      return false;
    }

    const user = await this.getUserById(request.userId);
    if (!user) {
      logger.info(`No user has been found for id ${passwordResetRequestId}. Aborting request`);
      return false;
    }

    user.passwordHash = await this._hashPassword(password);

    logger.info(`Updating user ${user._id} with new password`);
    await this.saveUser(user);
    logger.info(`Deleting password reset request ${passwordResetRequestId}`);
    await this.deletePasswordResetRequestById(passwordResetRequestId);
    return user;
  }

  savePasswordResetRequest(request) {
    return this.passwordResetRequestStore.save(request);
  }

  _hashPassword(password) {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  }

  _buildEmptyUser() {
    return {
      _id: uniqueId.create(),
      provider: null,
      username: null,
      passwordHash: null,
      email: null,
      roles: [],
      expires: null,
      verificationCode: null,
      lockedOut: false,
      profile: null
    };
  }
}

export default UserService;
