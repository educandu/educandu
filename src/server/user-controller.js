import express from 'express';
import passport from 'passport';
import urls from '../utils/urls';
import session from 'express-session';
import { NotFound } from 'http-errors';
import connectMongo from 'connect-mongo';
import PageRenderer from './page-renderer';
import passportLocal from 'passport-local';
import Database from '../stores/database.js';
import permissions from '../domain/permissions';
import UserService from '../services/user-service';
import MailService from '../services/mail-service';
import requestHelper from '../utils/request-helper';
import ClientDataMapper from './client-data-mapper';
import ServerConfig from '../bootstrap/server-config';
import needsPermission from '../domain/needs-permission-middleware';
import sessionsStoreSpec from '../stores/collection-specs/sessions';
import { CREATE_USER_RESULT_SUCCESS } from '../domain/user-management';
import needsAuthentication from '../domain/needs-authentication-middleware';

const jsonParser = express.json();
const LocalStrategy = passportLocal.Strategy;
const MongoSessionStore = connectMongo(session);

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
      store: new MongoSessionStore({
        client: this.database._mongoClient,
        collection: sessionsStoreSpec.name,
        ttl: this.serverConfig.sessionDurationInMinutes * 60,
        autoRemove: 'disabled', // We use our own index
        stringify: false // Do not serialize session data
      })
    }));

    router.use(passport.initialize());
    router.use(passport.session());

    passport.use(new LocalStrategy((username, password, cb) => {
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
    router.get('/register', (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'register', {});
    });

    router.get('/reset-password', (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'reset-password', {});
    });

    router.get('/complete-registration/:verificationCode', async (req, res) => {
      const user = await this.userService.verifyUser(req.params.verificationCode);
      if (!user) {
        throw new NotFound();
      }

      return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'complete-registration', {});
    });

    router.get('/login', (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'login', {});
    });

    router.get('/logout', (req, res) => {
      req.logout();
      return res.redirect(urls.getDefaultLogoutRedirectUrl());
    });

    router.get('/profile', needsAuthentication(), (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'profile', {});
    });

    router.get('/complete-password-reset/:passwordResetRequestId', async (req, res) => {
      const resetRequest = await this.userService.getPasswordResetRequestById(req.params.passwordResetRequestId);
      if (!resetRequest) {
        throw new NotFound();
      }

      const initialState = { passwordResetRequestId: resetRequest._id };
      return this.pageRenderer.sendPage(req, res, 'settings-bundle', 'complete-password-reset', initialState);
    });

    router.get('/users', needsPermission(permissions.EDIT_USERS), async (req, res) => {
      const initialState = await this.userService.getAllUsers();
      return this.pageRenderer.sendPage(req, res, 'edit-bundle', 'users', initialState);
    });
  }

  registerApi(router) {
    router.get('/api/v1/users', needsPermission(permissions.EDIT_USERS), async (req, res) => {
      const result = await this.userService.getAllUsers();
      res.send({ users: result });
    });

    router.post('/api/v1/users', jsonParser, async (req, res) => {
      const { username, password, email } = req.body;
      const { result, user } = await this.userService.createUser(username, password, email);

      if (result === CREATE_USER_RESULT_SUCCESS) {
        const { origin } = requestHelper.getHostInfo(req);
        const verificationLink = urls.concatParts(origin, urls.getCompleteRegistrationUrl(user.verificationCode));
        await this.mailService.sendRegistrationVerificationLink(email, verificationLink);
      }

      res.send({ result, user: user ? this.clientDataMapper.dbUserToClientUser(user) : null });
    });

    router.post('/api/v1/users/request-password-reset', jsonParser, async (req, res) => {
      const { email } = req.body;
      const user = await this.userService.getUserByEmailAddress(email);

      if (user) {
        const resetRequest = await this.userService.createPasswordResetRequest(user);
        const { origin } = requestHelper.getHostInfo(req);
        const resetCompletionLink = urls.concatParts(origin, urls.getCompletePasswordResetUrl(resetRequest._id));
        await this.mailService.sendPasswordResetRequestCompletionLink(user.email, resetCompletionLink);
      }

      return res.send({});
    });

    router.post('/api/v1/users/complete-password-reset', jsonParser, async (req, res) => {
      const { passwordResetRequestId, password } = req.body;
      const user = await this.userService.completePasswordResetRequest(passwordResetRequestId, password);
      if (!user) {
        throw new NotFound();
      }

      return res.send({ user });
    });

    router.post('/api/v1/users/profile', [needsAuthentication(), jsonParser], async (req, res) => {
      const userId = req.user._id;
      const { profile } = req.body;
      const savedProfile = await this.userService.updateUserProfile(userId, profile);
      if (!savedProfile) {
        throw new NotFound();
      }

      return res.send({ profile: savedProfile });
    });

    router.post('/api/v1/users/login', jsonParser, (req, res, next) => {
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
    });

    router.post('/api/v1/users/:userId/roles', [needsPermission(permissions.EDIT_USERS), jsonParser], async (req, res) => {
      const { userId } = req.params;
      const { roles } = req.body;
      const newRoles = await this.userService.updateUserRoles(userId, roles);
      return res.send({ roles: newRoles });
    });

    router.post('/api/v1/users/:userId/lockedOut', [needsPermission(permissions.EDIT_USERS), jsonParser], async (req, res) => {
      const { userId } = req.params;
      const { lockedOut } = req.body;
      const newLockedOutState = await this.userService.updateUserLockedOutState(userId, lockedOut);
      return res.send({ lockedOut: newLockedOutState });
    });
  }
}

export default UserController;
