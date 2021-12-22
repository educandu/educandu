import express from 'express';
import passport from 'passport';
import urls from '../utils/urls.js';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passportLocal from 'passport-local';
import Database from '../stores/database.js';
import { PAGE_NAME } from '../domain/page-name.js';
import permissions from '../domain/permissions.js';
import UserService from '../services/user-service.js';
import MailService from '../services/mail-service.js';
import PageRenderer from '../server/page-renderer.js';
import requestHelper from '../utils/request-helper.js';
import ClientDataMapper from './client-data-mapper.js';
import ServerConfig from '../bootstrap/server-config.js';
import { exportUser } from '../domain/built-in-users.js';
import ApiKeyStrategy from '../domain/api-key-strategy.js';
import { SAVE_USER_RESULT } from '../domain/user-management.js';
import { validateBody } from '../domain/validation-middleware.js';
import needsPermission from '../domain/needs-permission-middleware.js';
import sessionsStoreSpec from '../stores/collection-specs/sessions.js';
import needsAuthentication from '../domain/needs-authentication-middleware.js';
import {
  postUserBodySchema,
  postUserAccountBodySchema,
  postUserProfileBodySchema,
  postUserPasswordResetRequestBodySchema,
  postUserPasswordResetCompletionBodySchema,
  postUserRolesBodySchema,
  postUserLockedOutBodySchema
} from '../domain/schemas/user-schemas.js';

const jsonParser = express.json();
const LocalStrategy = passportLocal.Strategy;

class UserController {
  static get inject() { return [ServerConfig, Database, UserService, MailService, ClientDataMapper, PageRenderer]; }

  constructor(serverConfig, database, userService, mailService, clientDataMapper, pageRenderer) {
    this.serverConfig = serverConfig;
    this.database = database;
    this.userService = userService;
    this.mailService = mailService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerMiddleware(router) {
    router.use(session({
      name: 'SID',
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
        const user = await this.userService.getUserById(input._id);
        return cb(null, user);
      } catch (err) {
        return cb(err);
      }
    });
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
    return res.redirect(urls.getDefaultLogoutRedirectUrl());
  }

  async handleGetCompletePasswordResetPage(req, res) {
    const resetRequest = await this.userService.getPasswordResetRequestById(req.params.passwordResetRequestId);
    const passwordResetRequestId = (resetRequest || {})._id;
    const initialState = { passwordResetRequestId };
    return this.pageRenderer.sendPage(req, res, PAGE_NAME.completePasswordReset, initialState);
  }

  async handleGetUsersPage(req, res) {
    const initialState = await this.userService.getAllUsers();
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
      const { origin } = requestHelper.getHostInfo(req);
      const verificationLink = urls.concatParts(origin, urls.getCompleteRegistrationUrl(user.verificationCode));
      await this.mailService.sendRegistrationVerificationLink({ username, email, verificationLink });
    }

    res.send({ result, user: user ? this.clientDataMapper.dbUserToClientUser(user) : null });
  }

  async handlePostUserAccount(req, res) {
    const userId = req.user._id;
    const provider = req.user.provider;
    const { username, email } = req.body;

    const { result, user } = await this.userService.updateUserAccount({ userId, provider, username, email });

    res.send({ result, user: user ? this.clientDataMapper.dbUserToClientUser(user) : null });
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

        return res.send({ user: this.clientDataMapper.dbUserToClientUser(user) });
      });
    })(req, res, next);
  }

  async handlePostUserPasswordResetRequest(req, res) {
    const { email } = req.body;
    const user = await this.userService.getUserByEmailAddress(email);

    if (user) {
      const resetRequest = await this.userService.createPasswordResetRequest(user);
      const { origin } = requestHelper.getHostInfo(req);
      const completionLink = urls.concatParts(origin, urls.getCompletePasswordResetUrl(resetRequest._id));
      await this.mailService.sendPasswordResetRequestCompletionLink({ username: user.username, email: user.email, completionLink });
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
    router.get('/api/v1/users', needsPermission(permissions.EDIT_USERS), (req, res) => this.handleGetUsers(req, res));

    router.post('/api/v1/users', [jsonParser, validateBody(postUserBodySchema)], (req, res) => this.handlePostUser(req, res));

    router.post('/api/v1/users/request-password-reset', [jsonParser, validateBody(postUserPasswordResetRequestBodySchema)], (req, res) => this.handlePostUserPasswordResetRequest(req, res));

    router.post('/api/v1/users/complete-password-reset', [jsonParser, validateBody(postUserPasswordResetCompletionBodySchema)], (req, res) => this.handlePostUserPasswordResetCompletion(req, res));

    router.post('/api/v1/users/account', [needsAuthentication(), jsonParser, validateBody(postUserAccountBodySchema)], (req, res) => this.handlePostUserAccount(req, res));

    router.post('/api/v1/users/profile', [needsAuthentication(), jsonParser, validateBody(postUserProfileBodySchema)], (req, res) => this.handlePostUserProfile(req, res));

    router.post('/api/v1/users/login', jsonParser, (req, res, next) => this.handlePostUserLogin(req, res, next));

    router.post('/api/v1/users/:userId/roles', [needsPermission(permissions.EDIT_USERS), jsonParser, validateBody(postUserRolesBodySchema)], (req, res) => this.handlePostUserRoles(req, res));

    router.post('/api/v1/users/:userId/lockedOut', [needsPermission(permissions.EDIT_USERS), jsonParser, validateBody(postUserLockedOutBodySchema)], (req, res) => this.handlePostUserLockedOut(req, res));
  }
}

export default UserController;
