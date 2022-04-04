import bcrypt from 'bcrypt';
import moment from 'moment';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import UserStore from '../stores/user-store.js';
import LockStore from '../stores/lock-store.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import PasswordResetRequestStore from '../stores/password-reset-request-store.js';
import {
  ROLE,
  SAVE_USER_RESULT,
  PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS,
  PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS
} from '../domain/constants.js';

const { BadRequest, NotFound } = httpErrors;

const DEFAULT_ROLE_NAME = ROLE.user;
const DEFAULT_PROVIDER_NAME = 'educandu';
const PASSWORD_SALT_ROUNDS = 1024;

const logger = new Logger(import.meta.url);

class UserService {
  static get inject() { return [UserStore, StoragePlanStore, PasswordResetRequestStore, LockStore]; }

  constructor(userStore, storagePlanStore, passwordResetRequestStore, lockStore) {
    this.userStore = userStore;
    this.storagePlanStore = storagePlanStore;
    this.passwordResetRequestStore = passwordResetRequestStore;
    this.lockStore = lockStore;
  }

  getAllUsers() {
    return this.userStore.getAllUsers();
  }

  getUserById(id) {
    return this.userStore.getUserById(id);
  }

  getUserByEmailAddress(email) {
    return this.userStore.getUserByEmailAddress(email);
  }

  async updateUserAccount({ userId, provider, username, email }) {
    logger.info(`Updating account data for user with id ${userId}`);
    const lowerCasedEmail = email.toLowerCase();

    const otherExistingUser = await this.userStore.findDifferentUserByUsernameOrEmail({
      userId, provider, username, email: lowerCasedEmail
    });

    if (otherExistingUser) {
      return otherExistingUser.email === lowerCasedEmail
        ? { result: SAVE_USER_RESULT.duplicateEmail, user: null }
        : { result: SAVE_USER_RESULT.duplicateUsername, user: null };
    }

    const user = await this.userStore.getUserById(userId);
    const updatedUser = { ...user, username, email: lowerCasedEmail };

    await this.userStore.saveUser(updatedUser);
    return { result: SAVE_USER_RESULT.success, user: updatedUser };
  }

  async updateUserProfile(userId, newProfile) {
    logger.info(`Updating profile for user with id ${userId}`);
    const user = await this.userStore.getUserById(userId);
    user.profile = newProfile;
    await this.userStore.saveUser(user);
    return user.profile;
  }

  async updateUserRoles(userId, newRoles) {
    logger.info(`Updating roles for user with id ${userId}: ${newRoles}`);
    const user = await this.userStore.getUserById(userId);
    const roleSet = new Set(newRoles || []);
    roleSet.add(DEFAULT_ROLE_NAME);
    user.roles = Array.from(roleSet.values());
    await this.userStore.saveUser(user);
    return user.roles;
  }

  async updateUserLockedOutState(userId, lockedOut) {
    logger.info(`Updating locked out state for user with id ${userId}: ${lockedOut}`);
    const user = await this.userStore.getUserById(userId);
    user.lockedOut = lockedOut;
    await this.userStore.saveUser(user);
    return user.lockedOut;
  }

  async updateUserStoragePlan(userId, storagePlanId) {
    logger.info(`Updating storage plan for user with id ${userId}: ${storagePlanId || '<null>'}`);

    const user = await this.userStore.getUserById(userId);
    if (!user) {
      throw new NotFound(`User with ID '${userId}' could not be found`);
    }

    const plan = storagePlanId ? await this.storagePlanStore.getStoragePlanById(storagePlanId) : null;
    if (storagePlanId && !plan) {
      throw new NotFound(`Storage plan with ID '${storagePlanId}' could not be found`);
    }

    const newStorage = { ...user.storage, plan: plan?._id || null };

    let oldPlanLock;
    let newPlanLock;
    try {
      oldPlanLock = user.storage.plan ? await this.lockStore.takeStoragePlanLock(user.storage.plan) : null;
      newPlanLock = newStorage.plan ? await this.lockStore.takeStoragePlanLock(newStorage.plan) : null;
      user.storage = newStorage;
      await this.userStore.saveUser(user);
    } finally {
      if (oldPlanLock) {
        await this.lockStore.releaseLock(oldPlanLock);
      }
      if (newPlanLock) {
        await this.lockStore.releaseLock(newPlanLock);
      }
    }

    return newStorage;
  }

  async updateUserUsedStorage(userId, usedBytes) {
    logger.info(`Updating usedBytes for user with id ${userId}: ${usedBytes}`);

    const user = await this.userStore.getUserById(userId);
    if (!user) {
      throw new NotFound(`User with ID '${userId}' could not be found`);
    }

    if (!user.storage.plan) {
      throw new BadRequest(`User with ID '${userId}' does not have storage plan allocated`);
    }

    user.storage = { ...user.storage, usedBytes };
    await this.userStore.saveUser(user);
    return user;
  }

  async addUserStorageReminder(userId, executingUser) {
    logger.info(`Adding storage reminder for user with id ${userId}`);

    const user = await this.userStore.getUserById(userId);
    if (!user) {
      throw new NotFound(`User with ID '${userId}' could not be found`);
    }

    const newStorage = {
      ...user.storage,
      reminders: [
        ...user.storage.reminders,
        {
          timestamp: new Date(),
          createdBy: executingUser._id
        }
      ]
    };
    user.storage = newStorage;
    await this.userStore.saveUser(user);
    return newStorage;
  }

  async deleteAllUserStorageReminders(userId) {
    logger.info(`Deleting all storage reminders for user with id ${userId}`);

    const user = await this.userStore.getUserById(userId);
    if (!user) {
      throw new NotFound(`User with ID '${userId}' could not be found`);
    }

    const newStorage = {
      ...user.storage,
      reminders: []
    };
    user.storage = newStorage;
    await this.userStore.saveUser(user);
    return newStorage;
  }

  async addFavorite({ type, id, user }) {
    await this.userStore.addToUserFavorites({ userId: user._id, favoriteType: type, favoriteId: id, favoriteSetOn: new Date() });
    const updatedUser = await this.userStore.getUserById(user._id);
    return updatedUser;
  }

  async deleteFavorite({ type, id, user }) {
    await this.userStore.removeFromUserFavorites({ userId: user._id, favoriteType: type, favoriteId: id });
    const updatedUser = await this.userStore.getUserById(user._id);
    return updatedUser;
  }

  async createUser({ username, password, email, provider = DEFAULT_PROVIDER_NAME, roles = [DEFAULT_ROLE_NAME], verified = false }) {
    const lowerCasedEmail = email.toLowerCase();

    const existingUser = await this.userStore.findUserByUsernameOrEmail({ provider, username, email: lowerCasedEmail });
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
    user.expires = verified ? null : moment().add(PENDING_USER_REGISTRATION_EXPIRATION_IN_HOURS, 'hours').toDate();
    user.verificationCode = verified ? null : uniqueId.create();

    logger.info(`Creating new user with id ${user._id}`);
    await this.userStore.saveUser(user);
    return { result: SAVE_USER_RESULT.success, user };
  }

  async ensureExternalUser({ _id, username, hostName }) {
    const user = {
      ...this._buildEmptyUser(),
      _id,
      username,
      provider: `external/${hostName}`
    };
    await this.userStore.saveUser(user);
  }

  async verifyUser(verificationCode, provider = DEFAULT_PROVIDER_NAME) {
    logger.info(`Verifying user with verification code ${verificationCode}`);
    let user = null;
    try {
      user = await this.userStore.findUserByVerificationCode({ provider, verificationCode });
      if (user) {
        logger.info(`Found user with id ${user._id}`);
        user.expires = null;
        user.verificationCode = null;
        await this.userStore.saveUser(user);
      } else {
        logger.info(`No user found for verification code ${verificationCode}`);
      }
    } catch (err) {
      logger.fatal(err);
    }

    return user;
  }

  async authenticateUser(emailOrUsername, password, provider = DEFAULT_PROVIDER_NAME) {
    const user = await this.userStore.findUserByLogin({ emailOrUsername, provider });
    if (!user || user.expires || user.lockedOut) {
      return false;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    return match ? user : false;
  }

  async createPasswordResetRequest(user) {
    if (user.provider !== DEFAULT_PROVIDER_NAME) {
      throw new Error('Cannot reset passwords on third party users');
    }

    const request = {
      _id: uniqueId.create(),
      userId: user._id,
      expires: moment().add(PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_HOURS, 'hours').toDate()
    };

    logger.info(`Creating password reset request ${request._id} for user with id ${request.userId}`);
    await this.passwordResetRequestStore.saveRequest(request);
    return request;
  }

  async completePasswordResetRequest(passwordResetRequestId, password) {
    logger.info(`Completing password reset request ${passwordResetRequestId}`);
    const request = await this.passwordResetRequestStore.getRequestById(passwordResetRequestId);
    if (!request) {
      logger.info(`No password reset request has been found for id ${passwordResetRequestId}. Aborting request`);
      return false;
    }

    const user = await this.userStore.getUserById(request.userId);
    if (!user) {
      logger.info(`No user has been found for id ${passwordResetRequestId}. Aborting request`);
      return false;
    }

    user.passwordHash = await this._hashPassword(password);

    logger.info(`Updating user ${user._id} with new password`);
    await this.userStore.saveUser(user);
    logger.info(`Deleting password reset request ${passwordResetRequestId}`);
    await this.passwordResetRequestStore.deleteRequestById(passwordResetRequestId);
    return user;
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
      profile: null,
      storage: {
        plan: null,
        usedBytes: 0,
        reminders: []
      },
      favorites: []
    };
  }
}

export default UserService;
