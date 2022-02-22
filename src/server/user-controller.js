/* eslint-disable max-params */
import express from 'express';
import passport from 'passport';
import urls from '../utils/urls.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passportLocal from 'passport-local';
import Database from '../stores/database.js';
import UserStore from '../stores/user-store.js';
import { PAGE_NAME } from '../domain/page-name.js';
import permissions from '../domain/permissions.js';
import UserService from '../services/user-service.js';
import MailService from '../services/mail-service.js';
import PageRenderer from '../server/page-renderer.js';
import ClientDataMapper from './client-data-mapper.js';
import ServerConfig from '../bootstrap/server-config.js';
import { exportUser } from '../domain/built-in-users.js';
import { SAVE_USER_RESULT } from '../domain/constants.js';
import ApiKeyStrategy from '../domain/api-key-strategy.js';
import StoragePlanStore from '../stores/storage-plan-store.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import sessionsStoreSpec from '../stores/collection-specs/sessions.js';
import requestHelper, { getHostInfo } from '../utils/request-helper.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import { validateBody, validateParams } from '../domain/validation-middleware.js';
import PasswordResetRequestStore from '../stores/password-reset-request-store.js';
import {
  postUserBodySchema,
  postUserAccountBodySchema,
  postUserProfileBodySchema,
  postUserPasswordResetRequestBodySchema,
  postUserPasswordResetCompletionBodySchema,
  postUserRolesBodySchema,
  postUserLockedOutBodySchema,
  postUserStoragePlanBodySchema,
  userIdParamsSchema
} from '../domain/schemas/user-schemas.js';

const jsonParser = express.json();
const LocalStrategy = passportLocal.Strategy;

class UserController {
  static get inject() {
    return [
      ServerConfig,
      Database,
      UserStore,
      StoragePlanStore,
      PasswordResetRequestStore,
      UserService,
      MailService,
      ClientDataMapper,
      PageRenderer
    ];
  }

  constructor(
    serverConfig,
    database,
    userStore,
    storagePlanStore,
    passwordResetRequestStore,
    userService,
    mailService,
    clientDataMapper,
    pageRenderer
  ) {
    this.database = database;
    this.userStore = userStore;
    this.userService = userService;
    this.mailService = mailService;
    this.serverConfig = serverConfig;
    this.pageRenderer = pageRenderer;
    this.clientDataMapper = clientDataMapper;
    this.storagePlanStore = storagePlanStore;
    this.passwordResetRequestStore = passwordResetRequestStore;
  }

  handleGetRegisterPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.register, {});
  }

  handleGetResetPasswordPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.resetPassword, {});
  }

  async handleCompleteRegistrationPage(req, res) {
    const user = await this.userService.verifyUser(req.params.verificationCode);
    const initialState = { user };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.completeRegistration, initialState);
  }

  handleGetLoginPage(req, res) {
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.login, {});
  }

  handleGetLogoutPage(req, res) {
    req.logout();
    res.clearCookie(this.serverConfig.sessionCookieName);
    return res.redirect(urls.getDefaultLogoutRedirectUrl());
  }

  async handleGetCompletePasswordResetPage(req, res) {
    const resetRequest = await this.passwordResetRequestStore.getPasswordResetRequestById(req.params.passwordResetRequestId);
    const passwordResetRequestId = (resetRequest || {})._id;
    const initialState = { passwordResetRequestId };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.completePasswordReset, initialState);
  }

  async handleGetUsersPage(req, res) {
    const [rawUsers, storagePlans] = await Promise.all([this.userStore.getAllUsers(), this.storagePlanStore.getAllStoragePlans()]);
    const initialState = { users: this.clientDataMapper.mapUsersForAdminArea(rawUsers), storagePlans };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.users, initialState);
  }

  async handleGetUsers(req, res) {
    const result = await this.userStore.getAllUsers();
    res.send({ users: result });
  }

  async handlePostUser(req, res) {
    const { username, password, email } = req.body;

    const { result, user } = await this.userService.createUser({ username, password, email });

    if (result === SAVE_USER_RESULT.success) {
      const { origin } = requestHelper.getHostInfo(req);
      const verificationLink = urls.concatParts(origin, urls.getCompleteRegistrationUrl(user.verificationCode));
      await this.mailService.sendRegistrationVerificationEmail({ username, email, verificationLink });
    }

    res.send({ result, user: user ? this.clientDataMapper.mapWebsiteUser(user) : null });
  }

  async handlePostUserAccount(req, res) {
    const userId = req.user._id;
    const provider = req.user.provider;
    const { username, email } = req.body;

    const { result, user } = await this.userService.updateUserAccount({ userId, provider, username, email });

    res.send({ result, user: user ? this.clientDataMapper.mapWebsiteUser(user) : null });
  }

  async handlePostUserProfile(req, res) {
    const userId = req.user._id;
    const { profile } = req.body;
    const savedProfile = await this.userService.updateUserProfile(userId, profile);
    if (!savedProfile) {
      res.status(404).send('Invalid user id');
      return;
    }

    res.send({ profile: savedProfile });
  }

  handlePostUserLogin(req, res, next) {
    passport.authenticate('local', (err, user) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.send({ user: null });
      }

      return req.login(user, loginError => {
        if (loginError) {
          return next(loginError);
        }

        return res.send({ user: this.clientDataMapper.mapWebsiteUser(user) });
      });
    })(req, res, next);
  }

  async handlePostUserPasswordResetRequest(req, res) {
    const { email } = req.body;
    const user = await this.userStore.getUserByEmailAddress(email);

    if (user) {
      const resetRequest = await this.userService.createPasswordResetRequest(user);
      const { origin } = requestHelper.getHostInfo(req);
      const completionLink = urls.concatParts(origin, urls.getCompletePasswordResetUrl(resetRequest._id));
      await this.mailService.sendPasswordResetEmail({ username: user.username, email: user.email, completionLink });
    }

    res.send({});
  }

  async handlePostUserPasswordResetCompletion(req, res) {
    const { passwordResetRequestId, password } = req.body;
    const user = await this.userService.completePasswordResetRequest(passwordResetRequestId, password);
    if (!user) {
      res.status(404).send('User not found');
      return;
    }

    res.send({ user });

  }

  async handlePostUserRoles(req, res) {
    const { userId } = req.params;
    const { roles } = req.body;
    const newRoles = await this.userService.updateUserRoles(userId, roles);
    return res.send({ roles: newRoles });
  }

  async handlePostUserLockedOut(req, res) {
    const { userId } = req.params;
    const { lockedOut } = req.body;
    const newLockedOutState = await this.userService.updateUserLockedOutState(userId, lockedOut);
    return res.send({ lockedOut: newLockedOutState });
  }

  async handlePostUserStoragePlan(req, res) {
    const { userId } = req.params;
    const { storagePlanId } = req.body;
    const newStorage = await this.userService.updateUserStoragePlan(userId, storagePlanId);
    return res.send(newStorage);
  }

  async handlePostUserStorageReminder(req, res) {
    const { user } = req;
    const { userId } = req.params;
    const newStorage = await this.userService.addUserStorageReminder(userId, user);
    return res.send(newStorage);
  }

  async handleDeleteAllUserStorageReminders(req, res) {
    const { userId } = req.params;
    const newStorage = await this.userService.deleteAllUserStorageReminders(userId);
    return res.send(newStorage);
  }

  registerMiddleware(router) {
    router.use(session({
      name: this.serverConfig.sessionCookieName,
      cookie: {
        httpOnly: true,
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
          const { domain } = getHostInfo(req);
          req.session.cookie.domain = domain;
        }

        next();
      });
    }

    router.use(passport.initialize());
    router.use(passport.session());
    router.use(passport.authenticate('apikey', { session: false }));

    passport.use('apikey', new ApiKeyStrategy((apikey, cb) => {
      const { exportApiKey } = this.serverConfig;

      return exportApiKey && apikey === exportApiKey
        ? cb(null, exportUser)
        : cb(null, false);
    }));

    passport.use('local', new LocalStrategy((username, password, cb) => {
      this.userService.authenticateUser(username, password)
        .then(user => cb(null, user || false))
        .catch(err => cb(err));
    }));

    passport.serializeUser((user, cb) => {
      cb(null, { _id: user._id });
    });

    passport.deserializeUser(async (input, cb) => {
      try {
        const user = await this.userStore.getUserById(input._id);
        return cb(null, user);
      } catch (err) {
        return cb(err);
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
  }
}

export default UserController;
