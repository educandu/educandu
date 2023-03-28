import by from 'thenby';
import bcrypt from 'bcrypt';
import moment from 'moment';
import httpErrors from 'http-errors';
import Logger from '../common/logger.js';
import uniqueId from '../utils/unique-id.js';
import UserStore from '../stores/user-store.js';
import LockStore from '../stores/lock-store.js';
import RoomStore from '../stores/room-store.js';
import DocumentStore from '../stores/document-store.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import TransactionRunner from '../stores/transaction-runner.js';
import PasswordResetRequestStore from '../stores/password-reset-request-store.js';
import {
  ROLE,
  FAVORITE_TYPE,
  SAVE_USER_RESULT,
  USER_ACTIVITY_TYPE,
  PENDING_USER_REGISTRATION_EXPIRATION_IN_MINUTES,
  PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_MINUTES,
  ERROR_CODES,
  EMAIL_NOTIFICATION_FREQUENCY
} from '../domain/constants.js';

const { BadRequest, NotFound, Unauthorized } = httpErrors;

const DEFAULT_ROLE = ROLE.user;
const DEFAULT_EMAIL_NOTIFICATION_FREQUENCY = EMAIL_NOTIFICATION_FREQUENCY.weekly;
const PASSWORD_SALT_ROUNDS = 1024;

const logger = new Logger(import.meta.url);

const completionFunction = Symbol('completion');

class UserService {
  static dependencies = [UserStore, StoragePlanStore, PasswordResetRequestStore, DocumentStore, RoomStore, LockStore, TransactionRunner];

  constructor(userStore, storagePlanStore, passwordResetRequestStore, documentStore, roomStore, lockStore, transactionRunner) {
    this.userStore = userStore;
    this.storagePlanStore = storagePlanStore;
    this.passwordResetRequestStore = passwordResetRequestStore;
    this.roomStore = roomStore;
    this.documentStore = documentStore;
    this.lockStore = lockStore;
    this.transactionRunner = transactionRunner;
  }

  getAllUsers() {
    return this.userStore.getAllUsers();
  }

  async getActiveUsersBySearch({ query, limit = Number.MAX_VALUE }) {
    const sanitizedQuery = query.trim().toLowerCase();
    if (!sanitizedQuery) {
      return [];
    }

    const matchingUsers = await this.userStore.getActiveUserBySearch(sanitizedQuery);
    return matchingUsers
      .map(user => {
        const sanitizedEmail = user.email.toLowerCase();
        const sanitizedDisplayName = user.displayName.toLowerCase();

        let relevance;
        if (sanitizedEmail === sanitizedQuery || sanitizedDisplayName === sanitizedQuery) {
          relevance = 1;
        } else if (sanitizedEmail.startsWith(sanitizedQuery) || sanitizedDisplayName.startsWith(sanitizedQuery)) {
          relevance = 2;
        } else {
          relevance = 3;
        }

        return { ...user, _relevance: relevance };
      })
      .sort(by(user => user._relevance)
        .thenBy(user => user.displayName, { ignoreCase: true })
        .thenBy(user => user.email, { ignoreCase: true }))
      .map(user => {
        delete user._relevance;
        return user;
      })
      .slice(0, limit);
  }

  getUserById(id) {
    return this.userStore.getUserById(id);
  }

  getActiveConfirmedUserByEmail(email) {
    return email ? this.userStore.findActiveConfirmedUserByEmail(email.toLowerCase()) : null;
  }

  async updateUserAccount({ userId, email }) {
    logger.info(`Updating account data for user with id ${userId}`);
    const lowerCasedEmail = email.toLowerCase();

    const existingActiveUserWithEmail = await this.userStore.findActiveUserByEmail(lowerCasedEmail);

    if (existingActiveUserWithEmail && existingActiveUserWithEmail._id !== userId) {
      return { result: SAVE_USER_RESULT.duplicateEmail, user: null };
    }

    const user = await this.userStore.getUserById(userId);
    const updatedUser = { ...user, email: lowerCasedEmail };

    await this.userStore.saveUser(updatedUser);
    return { result: SAVE_USER_RESULT.success, user: updatedUser };
  }

  async updateUserProfile({ userId, displayName, organization, introduction }) {
    logger.info(`Updating profile for user with id ${userId}`);
    const user = await this.userStore.getUserById(userId);
    const updatedUser = { ...user, displayName, organization, introduction };

    await this.userStore.saveUser(updatedUser);
    return updatedUser;
  }

  async updateUserNotificationSettings({ userId, emailNotificationFrequency }) {
    logger.info(`Updating notification settings for user with id ${userId}`);
    const user = await this.userStore.getUserById(userId);
    const updatedUser = { ...user, emailNotificationFrequency };

    await this.userStore.saveUser(updatedUser);
    return updatedUser;
  }

  async updateUserRole(userId, newRole) {
    logger.info(`Updating role for user with id ${userId}: ${newRole}`);
    const user = await this.userStore.getUserById(userId);
    user.role = newRole;
    await this.userStore.saveUser(user);
    return user.role;
  }

  async updateUserAccountLockedOn(userId, accountLockedOn) {
    logger.info(`${accountLockedOn ? 'Locking' : 'Unlocking'} account for user with id ${userId}.`);
    const user = await this.userStore.getUserById(userId);
    user.accountLockedOn = accountLockedOn;
    await this.userStore.saveUser(user);
    return user;
  }

  async closeUserAccount(userId) {
    const user = await this.getUserById(userId);
    const clearedUserData = {
      ...this._buildEmptyUser(),
      _id: userId,
      email: user.email,
      displayName: user.displayName,
      accountClosedOn: new Date()
    };
    await this.userStore.saveUser(clearedUserData);
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

    const newStorage = { ...user.storage, planId: plan?._id || null };

    let oldPlanLock;
    let newPlanLock;
    try {
      oldPlanLock = user.storage.planId ? await this.lockStore.takeStoragePlanLock(user.storage.planId) : null;
      newPlanLock = newStorage.planId ? await this.lockStore.takeStoragePlanLock(newStorage.planId) : null;
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

    if (!user.storage.planId) {
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

  async getFavorites({ user }) {
    const documentIds = user.favorites.filter(f => f.type === FAVORITE_TYPE.document).map(d => d.id);
    const roomIds = user.favorites.filter(f => f.type === FAVORITE_TYPE.room).map(r => r.id);
    const userIds = user.favorites.filter(f => f.type === FAVORITE_TYPE.user).map(u => u.id);

    const [documents, rooms, users] = await Promise.all([
      documentIds.length ? await this.documentStore.getDocumentsExtendedMetadataByIds(documentIds) : [],
      roomIds.length ? await this.roomStore.getRoomsByIds(roomIds) : [],
      userIds.length ? await this.userStore.getUsersByIds(userIds) : []
    ]);

    return user.favorites.map(f => {
      switch (f.type) {
        case FAVORITE_TYPE.user:
          return { ...f, data: users.find(u => u._id === f.id) };
        case FAVORITE_TYPE.room:
          return { ...f, data: rooms.find(r => r._id === f.id) };
        case FAVORITE_TYPE.document:
          return { ...f, data: documents.find(d => d._id === f.id) };
        default:
          return { ...f };
      }
    });
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

  async getActivities({ userId, limit = 30 }) {
    const user = await this.userStore.getUserById(userId);

    const createdRooms = await this.roomStore.getLatestRoomsCreatedByUser(userId, { limit });
    const joinedRooms = await this.roomStore.getLatestRoomsJoinedByUser(userId, { limit });
    const updatedRooms = await this.roomStore.getLatestRoomsUpdatedByUser(userId, { limit });
    const createdDocuments = await this.documentStore.getLatestDocumentsMetadataCreatedByUser(userId, { limit });
    const updatedDocuments = await this.documentStore.getLatestDocumentsMetadataUpdatedByUser(userId, { limit });

    const createdDocumentActivities = createdDocuments.map(document => ({
      type: USER_ACTIVITY_TYPE.documentCreated,
      timestamp: document.createdOn,
      data: { _id: document._id, title: document.title },
      isDeprecated: false
    }));

    const updatedDocumentActivities = updatedDocuments.map(document => ({
      type: USER_ACTIVITY_TYPE.documentUpdated,
      timestamp: document.updatedOn,
      data: { _id: document._id, title: document.title },
      isDeprecated: false
    }));

    const createdRoomActivities = createdRooms.map(room => ({
      type: USER_ACTIVITY_TYPE.roomCreated,
      timestamp: room.createdOn,
      data: { _id: room._id, name: room.name },
      isDeprecated: false
    }));

    const updatedRoomActivities = updatedRooms.map(room => ({
      type: USER_ACTIVITY_TYPE.roomUpdated,
      timestamp: room.updatedOn,
      data: { _id: room._id, name: room.name },
      isDeprecated: false
    }));

    const joinedRoomActivities = joinedRooms.map(room => ({
      type: USER_ACTIVITY_TYPE.roomJoined,
      timestamp: room.members.find(member => member.userId === userId).joinedOn,
      data: { _id: room._id, name: room.name },
      isDeprecated: false
    }));

    const latestFavorites = user.favorites.sort(by(f => f.setOn, 'desc')).slice(0, limit);
    const favoriteActivitiesMetadata = latestFavorites.map(favorite => {
      switch (favorite.type) {
        case FAVORITE_TYPE.document:
          return {
            type: USER_ACTIVITY_TYPE.documentMarkedFavorite,
            timestamp: favorite.setOn,
            data: null,
            isDeprecated: null,
            [completionFunction]: async () => {
              const document = await this.documentStore.getDocumentMetadataById(favorite.id);
              return {
                data: { _id: favorite.id, title: document?.title ?? null },
                isDeprecated: !document
              };
            }
          };
        case FAVORITE_TYPE.room:
          return {
            type: USER_ACTIVITY_TYPE.roomMarkedFavorite,
            timestamp: favorite.setOn,
            data: null,
            isDeprecated: null,
            [completionFunction]: async () => {
              const room = await this.roomStore.getRoomById(favorite.id);
              return {
                data: { _id: favorite.id, name: room?.name ?? null },
                isDeprecated: !room
              };
            }
          };
        case FAVORITE_TYPE.user:
          return {
            type: USER_ACTIVITY_TYPE.userMarkedFavorite,
            timestamp: favorite.setOn,
            data: null,
            isDeprecated: null,
            [completionFunction]: async () => {
              const favoriteUser = await this.userStore.getUserById(favorite.id);
              return {
                data: { _id: favorite.id, displayName: favoriteUser?.displayName ?? null },
                isDeprecated: !favoriteUser
              };
            }
          };
        default:
          return null;
      }
    });

    let incompleteActivities = [
      ...createdDocumentActivities,
      ...updatedDocumentActivities,
      ...createdRoomActivities,
      ...updatedRoomActivities,
      ...joinedRoomActivities,
      ...favoriteActivitiesMetadata
    ]
      .filter(item => item)
      .sort(by(item => item.timestamp, 'desc'));

    if (limit) {
      incompleteActivities = incompleteActivities.slice(0, limit);
    }

    return Promise.all(incompleteActivities.map(async activity => {
      if (activity[completionFunction]) {
        const completionValues = await activity[completionFunction]();
        delete activity[completionFunction];
        Object.assign(activity, completionValues);
      }

      return activity;
    }));
  }

  async createUser({ email, password, displayName, role = DEFAULT_ROLE, emailNotificationFrequency = DEFAULT_EMAIL_NOTIFICATION_FREQUENCY, verified = false }) {
    const lowerCasedEmail = email.toLowerCase();

    const existingActiveUserWithEmail = await this.userStore.findActiveUserByEmail(lowerCasedEmail);
    if (existingActiveUserWithEmail) {
      return { result: SAVE_USER_RESULT.duplicateEmail, user: null };
    }

    const user = {
      ...this._buildEmptyUser(),
      email: lowerCasedEmail,
      passwordHash: await this._hashPassword(password),
      displayName,
      role,
      emailNotificationFrequency,
      expiresOn: verified ? null : moment().add(PENDING_USER_REGISTRATION_EXPIRATION_IN_MINUTES, 'minutes').toDate(),
      verificationCode: verified ? null : uniqueId.create()
    };

    logger.info(`Creating new user with id ${user._id}`);
    await this.userStore.saveUser(user);
    return { result: SAVE_USER_RESULT.success, user };
  }

  recordUserLogIn(userId) {
    return this.userStore.updateUserLastLoggedInOn({ userId, lastLoggedInOn: new Date() });
  }

  async verifyUser(userId, verificationCode) {
    logger.info(`Verifying user with verification code ${verificationCode}`);
    let user = null;
    try {
      user = await this.userStore.findUserByVerificationCode(verificationCode);
      if (user && user._id === userId) {
        logger.info(`Verifying user with id ${user._id}`);
        user.expiresOn = null;
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

  async findConfirmedActiveUserById({ userId, throwIfLocked = false }) {
    const user = await this.userStore.findActiveUserById(userId);
    if (!user || user.expiresOn) {
      return null;
    }

    if (user.accountLockedOn && throwIfLocked) {
      const err = new Unauthorized('User account is locked');
      err.code = ERROR_CODES.userAccountLocked;
      throw err;
    }

    return user;
  }

  async findConfirmedActiveUserByEmailAndPassword({ email, password, throwIfLocked = false }) {
    if (!email || !password) {
      return null;
    }

    const lowerCasedEmail = email.toLowerCase();

    const user = await this.userStore.findActiveUserByEmail(lowerCasedEmail);
    if (!user || user.expiresOn) {
      return null;
    }

    if (user.accountLockedOn && throwIfLocked) {
      const err = new Unauthorized('User account is locked');
      err.code = ERROR_CODES.userAccountLocked;
      throw err;
    }

    const doesPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    return doesPasswordMatch ? user : null;
  }

  async createPasswordResetRequest(user, newPassword) {
    const newPasswordHash = await this._hashPassword(newPassword);
    const request = {
      _id: uniqueId.create(),
      userId: user._id,
      passwordHash: newPasswordHash,
      verificationCode: uniqueId.create(),
      expiresOn: moment().add(PENDING_PASSWORD_RESET_REQUEST_EXPIRATION_IN_MINUTES, 'minutes').toDate()
    };

    await this.transactionRunner.run(async session => {
      logger.info(`Creating password reset request ${request._id} for user with id ${request.userId}`);

      await this.passwordResetRequestStore.deleteRequestsByUserId(user._id, { session });
      await this.passwordResetRequestStore.saveRequest(request, { session });
    });

    return request;
  }

  async completePasswordResetRequest(passwordResetRequestId, verificationCode) {
    logger.info(`Completing password reset request ${passwordResetRequestId}`);
    const resetRequest = await this.passwordResetRequestStore.getRequestById(passwordResetRequestId);
    if (!resetRequest) {
      logger.info(`No password reset request has been found for id ${passwordResetRequestId}. Aborting request`);
      return null;
    }

    const user = await this.userStore.getUserById(resetRequest.userId);
    if (!user) {
      logger.info(`No user has been found for id ${resetRequest.userId}. Aborting request`);
      return null;
    }

    if (resetRequest.verificationCode !== verificationCode) {
      logger.info(`Incorrect verification code ${verificationCode} for password reset request ${passwordResetRequestId}. Aborting request`);
      return null;
    }

    logger.info(`Updating user ${user._id} with new password`);
    user.passwordHash = resetRequest.passwordHash;
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
      email: null,
      passwordHash: null,
      displayName: null,
      organization: '',
      introduction: '',
      role: DEFAULT_ROLE,
      expiresOn: null,
      verificationCode: null,
      storage: {
        planId: null,
        usedBytes: 0,
        reminders: []
      },
      favorites: [],
      emailNotificationFrequency: EMAIL_NOTIFICATION_FREQUENCY.never,
      accountLockedOn: null,
      accountClosedOn: null,
      lastLoggedInOn: null
    };
  }
}

export default UserService;
