import express from 'express';
import passport from 'passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passportLocal from 'passport-local';
import Database from '../stores/database.js';
import permissions from '../domain/permissions.js';
import UserService from '../services/user-service.js';
import ServerConfig from '../bootstrap/server-config.js';
import ApiKeyStrategy from '../domain/api-key-strategy.js';
import { exchangeUser } from '../domain/built-in-users.js';
import UserRequestHandler from './user-request-handler.js';
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
  static get inject() { return [ServerConfig, Database, UserService, UserRequestHandler]; }

  constructor(serverConfig, database, userService, userRequestHandler) {
    this.serverConfig = serverConfig;
    this.database = database;
    this.userService = userService;
    this.userRequestHandler = userRequestHandler;
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
      return apikey === this.serverConfig.importApiKey
        ? cb(null, exchangeUser)
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

  registerPages(router) {
    router.get('/register', (req, res) => this.userRequestHandler.handleGetRegisterPage(req, res));

    router.get('/reset-password', (req, res) => this.userRequestHandler.handleGetResetPasswordPage(req, res));

    router.get('/complete-registration/:verificationCode', (req, res) => this.userRequestHandler.handleCompleteRegistrationPage(req, res));

    router.get('/login', (req, res) => this.userRequestHandler.handleGetLoginPage(req, res));

    router.get('/logout', (req, res) => this.userRequestHandler.handleGetLogoutPage(req, res));

    router.get('/account', needsAuthentication(), (req, res) => this.userRequestHandler.handleGetAccountPage(req, res));

    router.get('/complete-password-reset/:passwordResetRequestId', (req, res) => this.userRequestHandler.handleGetCompletePasswordResetPage(req, res));

    router.get('/users', needsPermission(permissions.EDIT_USERS), (req, res) => this.userRequestHandler.handleGetUsersPage(req, res));
  }

  registerApi(router) {
    router.get('/api/v1/users', needsPermission(permissions.EDIT_USERS), (req, res) => this.userRequestHandler.handleGetUsers(req, res));

    router.post('/api/v1/users', [jsonParser, validateBody(postUserBodySchema)], (req, res) => this.userRequestHandler.handlePostUser(req, res));

    router.post('/api/v1/users/request-password-reset', [jsonParser, validateBody(postUserPasswordResetRequestBodySchema)], (req, res) => this.userRequestHandler.handlePostUserPasswordResetRequest(req, res));

    router.post('/api/v1/users/complete-password-reset', [jsonParser, validateBody(postUserPasswordResetCompletionBodySchema)], (req, res) => this.userRequestHandler.handlePostUserPasswordResetCompletion(req, res));

    router.post('/api/v1/users/account', [needsAuthentication(), jsonParser, validateBody(postUserAccountBodySchema)], (req, res) => this.userRequestHandler.handlePostUserAccount(req, res));

    router.post('/api/v1/users/profile', [needsAuthentication(), jsonParser, validateBody(postUserProfileBodySchema)], (req, res) => this.userRequestHandler.handlePostUserProfile(req, res));

    router.post('/api/v1/users/login', jsonParser, (req, res, next) => this.userRequestHandler.handlePostUserLogin(req, res, next));

    router.post('/api/v1/users/:userId/roles', [needsPermission(permissions.EDIT_USERS), jsonParser, validateBody(postUserRolesBodySchema)], (req, res) => this.userRequestHandler.handlePostUserRoles(req, res));

    router.post('/api/v1/users/:userId/lockedOut', [needsPermission(permissions.EDIT_USERS), jsonParser, validateBody(postUserLockedOutBodySchema)], (req, res) => this.userRequestHandler.handlePostUserLockedOut(req, res));
  }
}

export default UserController;
