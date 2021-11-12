import bcrypt from 'bcrypt';
import { add } from 'date-fns';
import { ROLE } from '../domain/role.js';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import UserStore from '../stores/user-store.js';
import { SAVE_USER_RESULT } from '../domain/user-management.js';
import PasswordResetRequestStore from '../stores/password-reset-request-store.js';

const DEFAULT_ROLE_NAME = ROLE.user;
const PROVIDER_NAME = 'elmu';
const PASSWORD_SALT_ROUNDS = 1024;
const PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS = { hours: 24 };
const PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS = { hours: 24 };

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

  getUserByEmailAddress(email, provider = PROVIDER_NAME) {
    return this.userStore.findOne({ email: email.toLowerCase(), provider });
  }

  findUser(username, provider = PROVIDER_NAME) {
    return this.userStore.findOne({ username, provider });
  }

  saveUser(user) {
    logger.info('Saving user with id %s', user._id);
    return this.userStore.save(user);
  }

  async updateUserAccount({ userId, username, email }) {
    logger.info('Updating account data for user with id %s', userId);
    const lowerCasedEmail = email.toLowerCase();

    const otherExistingUser = await this.userStore.findOne({
      $and: [
        { _id: { $ne: userId } },
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
    logger.info('Updating profile for user with id %s', userId);
    const user = await this.getUserById(userId);
    user.profile = newProfile;
    await this.saveUser(user);
    return user.profile;
  }

  async updateUserRoles(userId, newRoles) {
    logger.info('Updating roles for user with id %s: %j', userId, newRoles);
    const user = await this.getUserById(userId);
    const roleSet = new Set(newRoles || []);
    roleSet.add(DEFAULT_ROLE_NAME);
    user.roles = Array.from(roleSet.values());
    await this.saveUser(user);
    return user.roles;
  }

  async updateUserLockedOutState(userId, lockedOut) {
    logger.info('Updating locked out state for user with id %s: %j', userId, lockedOut);
    const user = await this.getUserById(userId);
    user.lockedOut = lockedOut;
    await this.saveUser(user);
    return user.lockedOut;
  }

  async createUser({ username, password, email, provider = PROVIDER_NAME, roles = [DEFAULT_ROLE_NAME], verified = false }) {
    const lowerCasedEmail = email.toLowerCase();

    const existingUser = await this.userStore.findOne({ $or: [{ username }, { email: lowerCasedEmail }] });
    if (existingUser) {
      return existingUser.email === lowerCasedEmail
        ? { result: SAVE_USER_RESULT.duplicateEmail, user: null }
        : { result: SAVE_USER_RESULT.duplicateUsername, user: null };
    }

    const user = {
      _id: uniqueId.create(),
      provider,
      username,
      passwordHash: await this._hashPassword(password),
      email: lowerCasedEmail,
      roles,
      expires: verified ? null : add(new Date(), PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS),
      verificationCode: verified ? null : uniqueId.create(),
      lockedOut: false
    };

    logger.info('Creating new user with id %s', user._id);
    await this.saveUser(user);
    return { result: SAVE_USER_RESULT.success, user };
  }

  async verifyUser(verificationCode, provider = PROVIDER_NAME) {
    logger.info('Verifying user with verification code %s', verificationCode);
    let user = null;
    try {
      user = await this.userStore.findOne({ verificationCode, provider });
      if (user) {
        logger.info('Found user with id %s', user._id);
        user.expires = null;
        user.verificationCode = null;
        await this.saveUser(user);
      } else {
        logger.info('No user found for verification code %s', verificationCode);
      }
    } catch (err) {
      logger.fatal(err);
    }

    return user;
  }

  async authenticateUser(username, password, provider = PROVIDER_NAME) {
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
    if (user.provider !== PROVIDER_NAME) {
      throw new Error('Cannot reset passwords on third party users');
    }

    const request = {
      _id: uniqueId.create(),
      userId: user._id,
      expires: add(new Date(), PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS)
    };

    logger.info('Creating password reset request %s for user with id %s', request._id, request.userId);
    await this.savePasswordResetRequest(request);
    return request;
  }

  async completePasswordResetRequest(passwordResetRequestId, password) {
    logger.info('Completing password reset request %s', passwordResetRequestId);
    const request = await this.getPasswordResetRequestById(passwordResetRequestId);
    if (!request) {
      logger.info('No password reset request has been found for id %s. Aborting request', passwordResetRequestId);
      return false;
    }

    const user = await this.getUserById(request.userId);
    if (!user) {
      logger.info('No user has been found for id %s. Aborting request', passwordResetRequestId);
      return false;
    }

    user.passwordHash = await this._hashPassword(password);

    logger.info('Updating user %s with new password', user._id);
    await this.saveUser(user);
    logger.info('Deleting password reset request %s', passwordResetRequestId);
    await this.deletePasswordResetRequestById(passwordResetRequestId);
    return user;
  }

  savePasswordResetRequest(request) {
    return this.passwordResetRequestStore.save(request);
  }

  _hashPassword(password) {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  }
}

export default UserService;
