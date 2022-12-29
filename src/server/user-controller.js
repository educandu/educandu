import express from 'express';
import passport from 'passport';
import httpErrors from 'http-errors';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import routes from '../utils/routes.js';
import passportLocal from 'passport-local';
import urlUtils from '../utils/url-utils.js';
import Database from '../stores/database.js';
import { PAGE_NAME } from '../domain/page-name.js';
import permissions from '../domain/permissions.js';
import requestUtils from '../utils/request-utils.js';
import UserService from '../services/user-service.js';
import MailService from '../services/mail-service.js';
import RoomService from '../services/room-service.js';
import PageRenderer from '../server/page-renderer.js';
import ServerConfig from '../bootstrap/server-config.js';
import rateLimit from '../domain/rate-limit-middleware.js';
import ApiKeyStrategy from '../domain/api-key-strategy.js';
import StorageService from '../services/storage-service.js';
import DocumentService from '../services/document-service.js';
import { ambMetadataUser } from '../domain/built-in-users.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import sessionsStoreSpec from '../stores/collection-specs/sessions.js';
import { generateSessionId, isSessionValid } from '../utils/session-utils.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import RequestLimitRecordService from '../services/request-limit-record-service.js';
import PasswordResetRequestService from '../services/password-reset-request-service.js';
import {
  ANTI_BRUTE_FORCE_MAX_REQUESTS,
  ANTI_BRUTE_FORCE_EXPIRES_IN_MS,
  COOKIE_SAME_SITE_POLICY,
  ERROR_CODES,
  SAVE_USER_RESULT
} from '../domain/constants.js';
import {
  postUserBodySchema,
  postUserAccountBodySchema,
  postUserProfileBodySchema,
  postUserPasswordResetRequestBodySchema,
  postUserPasswordResetCompletionBodySchema,
  postUserRolesBodySchema,
  postUserAccountLockedOnBodySchema,
  postUserStoragePlanBodySchema,
  userIdParamsSchema,
  favoriteBodySchema,
  loginBodySchema
} from '../domain/schemas/user-schemas.js';

const { NotFound, Forbidden, BadRequest } = httpErrors;

const jsonParser = express.json();
const LocalStrategy = passportLocal.Strategy;

class UserController {
  static get inject() {
    return [
      ServerConfig,
      Database,
      UserService,
      StorageService,
      DocumentService,
      PasswordResetRequestService,
      RequestLimitRecordService,
      MailService,
      ClientDataMappingService,
      RoomService,
      PageRenderer
    ];
  }

  constructor(
    serverConfig,
    database,
    userService,
    storageService,
    documentService,
    passwordResetRequestService,
    requestLimitRecordService,
    mailService,
    clientDataMappingService,
    roomService,
    pageRenderer
  ) {
    this.database = database;
    this.userService = userService;
    this.mailService = mailService;
    this.roomService = roomService;
    this.serverConfig = serverConfig;
    this.pageRenderer = pageRenderer;
    this.storageService = storageService;
    this.documentService = documentService;
    this.clientDataMappingService = clientDataMappingService;
    this.requestLimitRecordService = requestLimitRecordService;
    this.passwordResetRequestService = passwordResetRequestService;

    this.antiBruteForceRequestLimitOptions = {
      maxRequests: ANTI_BRUTE_FORCE_MAX_REQUESTS,
      expiresInMs: ANTI_BRUTE_FORCE_EXPIRES_IN_MS,
      service: this.requestLimitRecordService
    };
  }

  handleGetRegisterPage(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect(routes.getDefaultLoginRedirectUrl());
    }

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.register, {});
  }

  async handleCompleteRegistrationPage(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect(routes.getDefaultLoginRedirectUrl());
    }

    const user = await this.userService.verifyUser(req.params.verificationCode);
    const initialState = { user };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.completeRegistration, initialState);
  }

  handleGetLoginPage(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect(routes.getDefaultLoginRedirectUrl());
    }

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.login, {});
  }

  async handleGetLogoutPage(req, res) {
    if (req.isAuthenticated()) {
      const logout = () => new Promise((resolve, reject) =>
        req.logout(err => err ? reject(err) : resolve())
      );

      await logout();
      res.clearCookie(this.serverConfig.sessionCookieName);
    }

    return res.redirect(routes.getDefaultLogoutRedirectUrl());
  }

  handleGetResetPasswordPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.resetPassword, {});
  }

  async handleGetCompletePasswordResetPage(req, res) {
    const resetRequest = await this.passwordResetRequestService.getRequestById(req.params.passwordResetRequestId);
    const passwordResetRequestId = (resetRequest || {})._id;
    const initialState = { passwordResetRequestId };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.completePasswordReset, initialState);
  }

  async handleGetUserPage(req, res) {
    const { userId } = req.params;
    const viewingUser = req.user;

    const viewedUser = await this.userService.getUserById(userId);
    if (!viewedUser) {
      throw new NotFound();
    }

    const createdDocuments = await this.documentService.getMetadataOfLatestPublicDocumentsCreatedByUser(viewedUser._id);

    const mappedCreatedDocuments = await this.clientDataMappingService.mapDocsOrRevisions(createdDocuments);
    const mappedViewedUser = this.clientDataMappingService.mapWebsitePublicUser({ viewedUser, viewingUser });

    return this.pageRenderer.sendPage(req, res, PAGE_NAME.user, {
      user: mappedViewedUser,
      documents: mappedCreatedDocuments
    });
  }

  async handleGetUsersPage(req, res) {
    const [rawUsers, storagePlans] = await Promise.all([this.userService.getAllUsers(), this.storageService.getAllStoragePlans()]);
    const initialState = { users: this.clientDataMappingService.mapUsersForAdminArea(rawUsers), storagePlans };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.users, initialState);
  }

  async handleGetUsers(req, res) {
    const users = await this.userService.getAllUsers();
    const mappedUsers = this.clientDataMappingService.mapUsersForAdminArea(users);
    res.send({ users: mappedUsers });
  }

  async handlePostUser(req, res) {
    const { email, password, displayName } = req.body;

    const { result, user } = await this.userService.createUser({ email, password, displayName });

    if (result === SAVE_USER_RESULT.success) {
      const { origin } = requestUtils.getHostInfo(req);
      const verificationLink = urlUtils.concatParts(origin, routes.getCompleteRegistrationUrl(user.verificationCode));
      await this.mailService.sendRegistrationVerificationEmail({ email, displayName, verificationLink });
    }

    res.status(201).send({ result, user: user ? this.clientDataMappingService.mapWebsiteUser(user) : null });
  }

  async handlePostUserAccount(req, res) {
    const userId = req.user._id;
    const { email } = req.body;

    const { result, user } = await this.userService.updateUserAccount({ userId, email });

    res.status(201).send({ result, user: user ? this.clientDataMappingService.mapWebsiteUser(user) : null });
  }

  async handlePostUserProfile(req, res) {
    const userId = req.user._id;
    const { displayName, organization, introduction } = req.body;
    const updatedUser = await this.userService.updateUserProfile({ userId, displayName, organization, introduction });

    if (!updatedUser) {
      throw new NotFound();
    }

    res.status(201).send({ user: updatedUser });
  }

  handlePostUserLogin(req, res, next) {
    passport.authenticate('local', (err, user) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(201).send({ user: null });
      }

      return req.login(user, loginError => {
        return loginError
          ? next(loginError)
          : res.status(201).send({ user: this.clientDataMappingService.mapWebsiteUser(user) });
      });
    })(req, res, next);
  }

  async handlePostUserPasswordResetRequest(req, res) {
    const { email } = req.body;
    const user = await this.userService.getActiveUserByEmailAddress(email);

    if (user) {
      const resetRequest = await this.userService.createPasswordResetRequest(user);
      const { origin } = requestUtils.getHostInfo(req);
      const completionLink = urlUtils.concatParts(origin, routes.getCompletePasswordResetUrl(resetRequest._id));
      await this.mailService.sendPasswordResetEmail({ email: user.email, displayName: user.displayName, completionLink });
    }

    res.status(201).send({});
  }

  async handlePostUserPasswordResetCompletion(req, res) {
    const { passwordResetRequestId, password } = req.body;
    const user = await this.userService.completePasswordResetRequest(passwordResetRequestId, password);
    if (!user) {
      throw new NotFound();
    }

    res.status(201).send({ user });

  }

  async handlePostUserRoles(req, res) {
    const { userId } = req.params;
    const { roles } = req.body;
    const newRoles = await this.userService.updateUserRoles(userId, roles);
    return res.status(201).send({ roles: newRoles });
  }

  async handlePostUserAccountLockedOn(req, res) {
    const { userId } = req.params;
    const { accountLockedOn } = req.body;
    const accountLockedOnDate = accountLockedOn ? new Date(accountLockedOn) : null;

    if (isNaN(accountLockedOnDate)) {
      throw new BadRequest(`'${accountLockedOn}' is not a valid date string.`);
    }

    const updatedUser = await this.userService.updateUserAccountLockedOn(userId, accountLockedOnDate);
    const mappedUser = this.clientDataMappingService.mapUserForAdminArea(updatedUser);

    return res.status(201).send(mappedUser);
  }

  async handlePostUserStoragePlan(req, res) {
    const { userId } = req.params;
    const { storagePlanId } = req.body;
    const newStorage = await this.userService.updateUserStoragePlan(userId, storagePlanId);
    return res.status(201).send(newStorage);
  }

  async handlePostUserStorageReminder(req, res) {
    const { user } = req;
    const { userId } = req.params;
    const newStorage = await this.userService.addUserStorageReminder(userId, user);
    return res.status(201).send(newStorage);
  }

  async handleDeleteAllUserStorageReminders(req, res) {
    const { userId } = req.params;
    const newStorage = await this.userService.deleteAllUserStorageReminders(userId);
    return res.send(newStorage);
  }

  async handleGetFavorites(req, res) {
    const { user } = req;
    const favorites = await this.userService.getFavorites({ user });

    const mappedFavorites = await this.clientDataMappingService.mapUserFavorites(favorites, user);
    return res.send({ favorites: mappedFavorites });
  }

  async handlePostFavorite(req, res) {
    const { user } = req;
    const { type, id } = req.body;
    const updatedUser = await this.userService.addFavorite({ type, id, user });
    return res.status(201).send(this.clientDataMappingService.mapWebsiteUser(updatedUser));
  }

  async handleDeleteFavorite(req, res) {
    const { user } = req;
    const { type, id } = req.body;
    const updatedUser = await this.userService.deleteFavorite({ type, id, user });
    return res.send(this.clientDataMappingService.mapWebsiteUser(updatedUser));
  }

  async handleCloseUserAccount(req, res) {
    const { user } = req;
    const { userId } = req.params;

    if (user._id !== userId) {
      throw new Forbidden();
    }

    const userRooms = await this.roomService.getRoomsOwnedByUser(userId);
    for (const room of userRooms) {
      await this.storageService.deleteRoomAndResources({ roomId: room._id, roomOwnerId: userId });
    }
    await this.roomService.removeMembershipFromAllRoomsForUser(userId);
    await this.userService.closeUserAccount(userId);

    return res.status(204).end();
  }

  registerMiddleware(router) {
    passport.use('apikey', new ApiKeyStrategy((apikey, cb) => {
      const { ambConfig } = this.serverConfig;

      if (ambConfig?.apiKey && apikey === ambConfig.apiKey) {
        return cb(null, ambMetadataUser);
      }

      return cb(null, false);
    }));

    passport.use('local', new LocalStrategy({
      usernameField: 'email',
      passwordField: 'password'
    }, (email, password, cb) => {
      this.userService.findConfirmedActiveUserByEmailAndPassword({ email, password })
        .then(user => {
          if (user?.accountLockedOn) {
            const err = new Error('User account is locked');
            err.code = ERROR_CODES.userAccountLocked;
            throw err;
          }

          return cb(null, user || false);
        })
        .catch(err => cb(err));
    }));

    passport.serializeUser((user, cb) => {
      cb(null, { _id: user._id });
    });

    passport.deserializeUser(async (input, cb) => {
      try {
        const user = await this.userService.getUserById(input._id);
        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    });

    router.use(session({
      name: this.serverConfig.sessionCookieName,
      cookie: {
        httpOnly: true,
        sameSite: COOKIE_SAME_SITE_POLICY,
        domain: this.serverConfig.sessionCookieDomain,
        secure: this.serverConfig.sessionCookieSecure
      },
      secret: this.serverConfig.sessionSecret,
      resave: false,
      saveUninitialized: false, // Don't create session until something stored
      store: MongoStore.create({
        client: this.database._mongoClient,
        collectionName: sessionsStoreSpec.name,
        ttl: this.serverConfig.sessionDurationInMinutes * 60,
        autoRemove: 'disabled', // We use our own index
        stringify: false // Do not serialize session data
      }),
      genid: generateSessionId
    }));

    router.use((req, res, next) => {
      return isSessionValid(req)
        ? next()
        : req.session.regenerate(next);
    });

    if (!this.serverConfig.sessionCookieDomain) {
      router.use((req, res, next) => {
        if (req.session?.cookie) {
          const { domain } = requestUtils.getHostInfo(req);
          req.session.cookie.domain = domain;
        }

        next();
      });
    }

    router.use(passport.initialize());
    router.use(passport.session());
    router.use(passport.authenticate('apikey', { session: false }));

    router.use(async (req, res, next) => {
      try {
        let storagePlan;
        if (req.user?.storage.planId) {
          storagePlan = await this.storageService.getStoragePlanById(req.user.storage.planId);
        }
        req.storagePlan = storagePlan || null;
        return next();
      } catch (err) {
        return next(err);
      }
    });
  }

  registerPages(router) {
    router.get('/users/:userId', (req, res) => this.handleGetUserPage(req, res));

    router.get('/register', (req, res) => this.handleGetRegisterPage(req, res));

    router.get('/reset-password', (req, res) => this.handleGetResetPasswordPage(req, res));

    router.get('/complete-registration/:verificationCode', (req, res) => this.handleCompleteRegistrationPage(req, res));

    router.get('/login', (req, res) => this.handleGetLoginPage(req, res));

    router.get('/logout', (req, res) => this.handleGetLogoutPage(req, res));

    router.get('/complete-password-reset/:passwordResetRequestId', (req, res) => this.handleGetCompletePasswordResetPage(req, res));

    router.get('/users', needsPermission(permissions.EDIT_USERS), (req, res) => this.handleGetUsersPage(req, res));
  }

  registerApi(router) {
    router.get(
      '/api/v1/users',
      needsPermission(permissions.EDIT_USERS),
      (req, res) => this.handleGetUsers(req, res)
    );

    router.post(
      '/api/v1/users',
      jsonParser,
      validateBody(postUserBodySchema),
      (req, res) => this.handlePostUser(req, res)
    );

    router.post(
      '/api/v1/users/request-password-reset',
      rateLimit(this.antiBruteForceRequestLimitOptions),
      jsonParser,
      validateBody(postUserPasswordResetRequestBodySchema),
      (req, res) => this.handlePostUserPasswordResetRequest(req, res)
    );

    router.post(
      '/api/v1/users/complete-password-reset',
      rateLimit(this.antiBruteForceRequestLimitOptions),
      jsonParser,
      validateBody(postUserPasswordResetCompletionBodySchema),
      (req, res) => this.handlePostUserPasswordResetCompletion(req, res)
    );

    router.post(
      '/api/v1/users/account',
      needsAuthentication(),
      jsonParser,
      validateBody(postUserAccountBodySchema),
      (req, res) => this.handlePostUserAccount(req, res)
    );

    router.post(
      '/api/v1/users/profile',
      needsAuthentication(),
      jsonParser,
      validateBody(postUserProfileBodySchema),
      (req, res) => this.handlePostUserProfile(req, res)
    );

    router.post(
      '/api/v1/users/login',
      rateLimit(this.antiBruteForceRequestLimitOptions),
      jsonParser,
      validateBody(loginBodySchema),
      (req, res, next) => this.handlePostUserLogin(req, res, next)
    );

    router.post(
      '/api/v1/users/:userId/roles',
      needsPermission(permissions.EDIT_USERS),
      jsonParser,
      validateParams(userIdParamsSchema),
      validateBody(postUserRolesBodySchema),
      (req, res) => this.handlePostUserRoles(req, res)
    );

    router.post(
      '/api/v1/users/:userId/accountLockedOn',
      needsPermission(permissions.EDIT_USERS),
      jsonParser,
      validateParams(userIdParamsSchema),
      validateBody(postUserAccountLockedOnBodySchema),
      (req, res) => this.handlePostUserAccountLockedOn(req, res)
    );

    router.post(
      '/api/v1/users/:userId/storagePlan',
      needsPermission(permissions.EDIT_USERS),
      jsonParser,
      validateParams(userIdParamsSchema),
      validateBody(postUserStoragePlanBodySchema),
      (req, res) => this.handlePostUserStoragePlan(req, res)
    );

    router.post(
      '/api/v1/users/:userId/storageReminders',
      needsPermission(permissions.EDIT_USERS),
      validateParams(userIdParamsSchema),
      (req, res) => this.handlePostUserStorageReminder(req, res)
    );

    router.delete(
      '/api/v1/users/:userId/storageReminders',
      needsPermission(permissions.EDIT_USERS),
      validateParams(userIdParamsSchema),
      (req, res) => this.handleDeleteAllUserStorageReminders(req, res)
    );

    router.get(
      '/api/v1/users/favorites',
      needsAuthentication(),
      (req, res) => this.handleGetFavorites(req, res)
    );

    router.post(
      '/api/v1/users/favorites',
      needsAuthentication(),
      jsonParser,
      validateBody(favoriteBodySchema),
      (req, res) => this.handlePostFavorite(req, res)
    );

    router.delete(
      '/api/v1/users/favorites',
      needsAuthentication(),
      jsonParser,
      validateBody(favoriteBodySchema),
      (req, res) => this.handleDeleteFavorite(req, res)
    );

    router.delete(
      '/api/v1/users/:userId',
      needsAuthentication(),
      validateParams(userIdParamsSchema),
      (req, res) => this.handleCloseUserAccount(req, res)
    );
  }
}

export default UserController;
