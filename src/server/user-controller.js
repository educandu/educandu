/* eslint-disable max-params */
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
import ApiKeyStrategy from '../domain/api-key-strategy.js';
import StorageService from '../services/storage-service.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import sessionsStoreSpec from '../stores/collection-specs/sessions.js';
import { ambMetadataUser, exportUser } from '../domain/built-in-users.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import ClientDataMappingService from '../services/client-data-mapping-service.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import { COOKIE_SAME_SITE_POLICY, SAVE_USER_RESULT } from '../domain/constants.js';
import PasswordResetRequestService from '../services/password-reset-request-service.js';
import {
  postUserBodySchema,
  postUserAccountBodySchema,
  postUserProfileBodySchema,
  postUserPasswordResetRequestBodySchema,
  postUserPasswordResetCompletionBodySchema,
  postUserRolesBodySchema,
  postUserLockedOutBodySchema,
  postUserStoragePlanBodySchema,
  userIdParamsSchema,
  favoriteBodySchema,
  loginBodySchema
} from '../domain/schemas/user-schemas.js';

const { NotFound, Forbidden } = httpErrors;

const jsonParser = express.json();
const LocalStrategy = passportLocal.Strategy;

class UserController {
  static get inject() {
    return [
      ServerConfig,
      Database,
      UserService,
      StorageService,
      PasswordResetRequestService,
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
    passwordResetRequestService,
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
    this.clientDataMappingService = clientDataMappingService;
    this.passwordResetRequestService = passwordResetRequestService;
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

  handleGetLogoutPage(req, res) {
    if (req.isAuthenticated()) {
      req.logout();
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

  async handleGetUsersPage(req, res) {
    const [rawUsers, storagePlans] = await Promise.all([this.userService.getAllUsers(), this.storageService.getAllStoragePlans()]);
    const initialState = { users: this.clientDataMappingService.mapUsersForAdminArea(rawUsers), storagePlans };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.users, initialState);
  }

  async handleGetUsers(req, res) {
    const result = await this.userService.getAllUsers();
    res.send({ users: result });
  }

  async handlePostUser(req, res) {
    const { username, password, email } = req.body;

    const { result, user } = await this.userService.createUser({ username, password, email });

    if (result === SAVE_USER_RESULT.success) {
      const { origin } = requestUtils.getHostInfo(req);
      const verificationLink = urlUtils.concatParts(origin, routes.getCompleteRegistrationUrl(user.verificationCode));
      await this.mailService.sendRegistrationVerificationEmail({ username, email, verificationLink });
    }

    res.status(201).send({ result, user: user ? this.clientDataMappingService.mapWebsiteUser(user) : null });
  }

  async handlePostUserAccount(req, res) {
    const userId = req.user._id;
    const provider = req.user.provider;
    const { username, email } = req.body;

    const { result, user } = await this.userService.updateUserAccount({ userId, provider, username, email });

    res.status(201).send({ result, user: user ? this.clientDataMappingService.mapWebsiteUser(user) : null });
  }

  async handlePostUserProfile(req, res) {
    const userId = req.user._id;
    const { profile } = req.body;
    const savedProfile = await this.userService.updateUserProfile(userId, profile);
    if (!savedProfile) {
      throw new NotFound();
    }

    res.status(201).send({ profile: savedProfile });
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
        if (loginError) {
          return next(loginError);
        }

        return res.status(201).send({ user: this.clientDataMappingService.mapWebsiteUser(user) });
      });
    })(req, res, next);
  }

  async handlePostUserPasswordResetRequest(req, res) {
    const { email } = req.body;
    const user = await this.userService.getUserByEmailAddress(email);

    if (user) {
      const resetRequest = await this.userService.createPasswordResetRequest(user);
      const { origin } = requestUtils.getHostInfo(req);
      const completionLink = urlUtils.concatParts(origin, routes.getCompletePasswordResetUrl(resetRequest._id));
      await this.mailService.sendPasswordResetEmail({ username: user.username, email: user.email, completionLink });
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

  async handlePostUserLockedOut(req, res) {
    const { userId } = req.params;
    const { lockedOut } = req.body;
    const newLockedOutState = await this.userService.updateUserLockedOutState(userId, lockedOut);
    return res.status(201).send({ lockedOut: newLockedOutState });
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
    return res.send({ favorites: this.clientDataMappingService.mapUserFavorites(favorites) });
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

    const userPrivateRooms = await this.roomService.getPrivateRoomsOwnedByUser(userId);
    for (const room of userPrivateRooms) {
      // eslint-disable-next-line no-await-in-loop
      await this.storageService.deleteRoomAndResources({ roomId: room._id, roomOwnerId: userId });
    }
    await this.roomService.removeMembershipFromAllRoomsForUser(userId);
    await this.userService.closeUserAccount(userId);

    return res.status(204).end();
  }

  registerMiddleware(router) {
    router.use(session({
      name: this.serverConfig.sessionCookieName,
      cookie: {
        httpOnly: true,
        sameSite: COOKIE_SAME_SITE_POLICY,
        domain: this.serverConfig.sessionCookieDomain
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
      })
    }));

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

    passport.use('apikey', new ApiKeyStrategy((apikey, cb) => {
      const { exportApiKey, ambConfig } = this.serverConfig;

      if (exportApiKey && apikey === exportApiKey) {
        return cb(null, exportUser);
      }

      if (ambConfig?.apiKey && apikey === ambConfig.apiKey) {
        return cb(null, ambMetadataUser);
      }

      return cb(null, false);
    }));

    passport.use('local', new LocalStrategy({
      usernameField: 'emailOrUsername',
      passwordField: 'password'
    }, (emailOrUsername, password, cb) => {
      this.userService.authenticateUser({ emailOrUsername, password })
        .then(user => cb(null, user || false))
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

    router.use(async (req, res, next) => {
      try {
        let storagePlan;
        if (req.user?.storage.plan) {
          storagePlan = await this.storageService.getStoragePlanById(req.user.storage.plan);
        }
        // eslint-disable-next-line require-atomic-updates
        req.storagePlan = storagePlan || null;
        return next();
      } catch (err) {
        return next(err);
      }
    });
  }

  registerPages(router) {
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
      [jsonParser, validateBody(postUserBodySchema)],
      (req, res) => this.handlePostUser(req, res)
    );

    router.post(
      '/api/v1/users/request-password-reset',
      [jsonParser, validateBody(postUserPasswordResetRequestBodySchema)],
      (req, res) => this.handlePostUserPasswordResetRequest(req, res)
    );

    router.post(
      '/api/v1/users/complete-password-reset',
      [jsonParser, validateBody(postUserPasswordResetCompletionBodySchema)],
      (req, res) => this.handlePostUserPasswordResetCompletion(req, res)
    );

    router.post(
      '/api/v1/users/account',
      [needsAuthentication(), jsonParser, validateBody(postUserAccountBodySchema)],
      (req, res) => this.handlePostUserAccount(req, res)
    );

    router.post(
      '/api/v1/users/profile',
      [needsAuthentication(), jsonParser, validateBody(postUserProfileBodySchema)],
      (req, res) => this.handlePostUserProfile(req, res)
    );

    router.post(
      '/api/v1/users/login',
      jsonParser,
      validateBody(loginBodySchema),
      (req, res, next) => this.handlePostUserLogin(req, res, next)
    );

    router.post(
      '/api/v1/users/:userId/roles',
      [needsPermission(permissions.EDIT_USERS), jsonParser, validateParams(userIdParamsSchema), validateBody(postUserRolesBodySchema)],
      (req, res) => this.handlePostUserRoles(req, res)
    );

    router.post(
      '/api/v1/users/:userId/lockedOut',
      [needsPermission(permissions.EDIT_USERS), jsonParser, validateParams(userIdParamsSchema), validateBody(postUserLockedOutBodySchema)],
      (req, res) => this.handlePostUserLockedOut(req, res)
    );

    router.post(
      '/api/v1/users/:userId/storagePlan',
      [needsPermission(permissions.EDIT_USERS), jsonParser, validateParams(userIdParamsSchema), validateBody(postUserStoragePlanBodySchema)],
      (req, res) => this.handlePostUserStoragePlan(req, res)
    );

    router.post(
      '/api/v1/users/:userId/storageReminders',
      [needsPermission(permissions.EDIT_USERS), validateParams(userIdParamsSchema)],
      (req, res) => this.handlePostUserStorageReminder(req, res)
    );

    router.delete(
      '/api/v1/users/:userId/storageReminders',
      [needsPermission(permissions.EDIT_USERS), validateParams(userIdParamsSchema)],
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
