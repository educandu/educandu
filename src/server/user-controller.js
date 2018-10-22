const passport = require('passport');
const urls = require('../utils/urls');
const bodyParser = require('body-parser');
const session = require('express-session');
const connectMongo = require('connect-mongo');
const PageRenderer = require('./page-renderer');
const passportLocal = require('passport-local');
const Database = require('../stores/database.js');
const permissions = require('../domain/permissions');
const Users = require('../components/pages/users.jsx');
const Index = require('../components/pages/index.jsx');
const Login = require('../components/pages/login.jsx');
const UserService = require('../services/user-service');
const MailService = require('../services/mail-service');
const requestHelper = require('../utils/request-helper');
const ClientDataMapper = require('./client-data-mapper');
const Register = require('../components/pages/register.jsx');
const ServerSettings = require('../bootstrap/server-settings');
const ResetPassword = require('../components/pages/reset-password.jsx');
const needsPermission = require('../domain/needs-permission-middleware');
const sessionsStoreSpec = require('../stores/collection-specs/sessions');
const CompleteRegistration = require('../components/pages/complete-registration.jsx');
const CompletePasswordReset = require('../components/pages/complete-password-reset.jsx');

const jsonParser = bodyParser.json();
const LocalStrategy = passportLocal.Strategy;
const MongoSessionStore = connectMongo(session);

class UserController {
  static get inject() { return [ServerSettings, Database, UserService, MailService, ClientDataMapper, PageRenderer]; }

  constructor(serverSettings, database, userService, mailService, clientDataMapper, pageRenderer) {
    this.serverSettings = serverSettings;
    this.database = database;
    this.userService = userService;
    this.mailService = mailService;
    this.clientDataMapper = clientDataMapper;
    this.pageRenderer = pageRenderer;
  }

  registerMiddleware(app) {
    app.use(session({
      name: 'SID',
      secret: this.serverSettings.sessionSecret,
      resave: false,
      saveUninitialized: false, // Don't create session until something stored
      store: new MongoSessionStore({
        db: this.database._db,
        collection: sessionsStoreSpec.name,
        ttl: this.serverSettings.sessionDurationInMinutes * 60,
        autoRemove: 'disabled', // We use our own index
        stringify: false // Do not serialize session data
      })
    }));

    app.use(passport.initialize());
    app.use(passport.session());

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

  registerPages(app) {
    app.get('/register', (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'register', Register, {});
    });

    app.get('/reset-password', (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'reset-password', ResetPassword, {});
    });

    app.get('/complete-registration/:verificationCode', async (req, res) => {
      const user = await this.userService.verifyUser(req.params.verificationCode);
      if (!user) {
        return res.sendStatus(404);
      }

      return this.pageRenderer.sendPage(req, res, 'complete-registration', CompleteRegistration, {});
    });

    app.get('/', (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'index', Index, {});
    });

    app.get('/login', (req, res) => {
      return this.pageRenderer.sendPage(req, res, 'login', Login, {});
    });

    app.get('/logout', (req, res) => {
      req.logout();
      return res.redirect(urls.getDefaultLogoutRedirectUrl());
    });

    app.get('/complete-password-reset/:passwordResetRequestId', async (req, res) => {
      const resetRequest = await this.userService.getPasswordResetRequestById(req.params.passwordResetRequestId);
      if (!resetRequest) {
        return res.sendStatus(404);
      }

      const initialState = { passwordResetRequestId: resetRequest._id };
      return this.pageRenderer.sendPage(req, res, 'complete-password-reset', CompletePasswordReset, initialState);
    });

    app.get('/users', needsPermission(permissions.EDIT_USERS), async (req, res) => {
      const initialState = await this.userService.getAllUsers();
      return this.pageRenderer.sendPage(req, res, 'users', Users, initialState);
    });
  }

  registerApi(app) {
    app.post('/api/v1/users', jsonParser, async (req, res) => {
      const { username, password, email } = req.body;
      const user = await this.userService.createUser(username, password, email);
      const { origin } = requestHelper.getHostInfo(req);
      const verificationLink = urls.concatParts(origin, urls.getCompleteRegistrationUrl(user.verificationCode));
      await this.mailService.sendRegistrationVerificationLink(email, verificationLink);
      res.send({ user: this.clientDataMapper.dbUserToClientUser(user) });
    });

    app.post('/api/v1/users/request-password-reset', jsonParser, async (req, res) => {
      const { email } = req.body;
      const user = await this.userService.getUserByEmailAddress(email);
      if (!user) {
        return res.send({});
      }

      const resetRequest = await this.userService.createPasswordResetRequest(user);
      const { origin } = requestHelper.getHostInfo(req);
      const resetCompletionLink = urls.concatParts(origin, urls.getCompletePasswordResetUrl(resetRequest._id));
      await this.mailService.sendPasswordResetRequestCompletionLink(user.email, resetCompletionLink);
      return res.send({});
    });

    app.post('/api/v1/users/complete-password-reset', jsonParser, async (req, res) => {
      const { passwordResetRequestId, password } = req.body;
      const user = await this.userService.completePasswordResetRequest(passwordResetRequestId, password);
      return res.send({ user: user || null });
    });

    app.post('/api/v1/users/login', jsonParser, (req, res, next) => {
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

    app.post('/api/v1/users/:userId/roles', [needsPermission(permissions.EDIT_USERS), jsonParser], async (req, res) => {
      const { userId } = req.params;
      const { roles } = req.body;
      const newRoles = await this.userService.updateUserRoles(userId, roles);
      return res.send({ roles: newRoles });
    });

    app.post('/api/v1/users/:userId/lockedOut', [needsPermission(permissions.EDIT_USERS), jsonParser], async (req, res) => {
      const { userId } = req.params;
      const { lockedOut } = req.body;
      const newLockedOutState = await this.userService.updateUserLockedOutState(userId, lockedOut);
      return res.send({ lockedOut: newLockedOutState });
    });
  }
}

module.exports = UserController;
