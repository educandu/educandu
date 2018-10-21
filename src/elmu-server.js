const os = require('os');
const path = require('path');
const React = require('react');
const multer = require('multer');
const express = require('express');
const passport = require('passport');
const urls = require('./utils/urls');
const treeCrawl = require('tree-crawl');
const htmlescape = require('htmlescape');
const bodyParser = require('body-parser');
const Cdn = require('./repositories/cdn');
const parseBool = require('parseboolean');
const session = require('express-session');
const { Container } = require('./common/di');
const Root = require('./components/root.jsx');
const Database = require('./stores/database.js');
const Doc = require('./components/pages/doc.jsx');
const ReactDOMServer = require('react-dom/server');
const Docs = require('./components/pages/docs.jsx');
const Edit = require('./components/pages/edit.jsx');
const Menu = require('./components/pages/menu.jsx');
const ApiFactory = require('./plugins/api-factory');
const permissions = require('./domain/permissions');
const MongoStore = require('connect-mongo')(session);
const Users = require('./components/pages/users.jsx');
const Index = require('./components/pages/index.jsx');
const Login = require('./components/pages/login.jsx');
const Menus = require('./components/pages/menus.jsx');
const UserService = require('./services/user-service');
const MenuService = require('./services/menu-service');
const MailService = require('./services/mail-service');
const requestHelper = require('./utils/request-helper');
const LocalStrategy = require('passport-local').Strategy;
const Article = require('./components/pages/article.jsx');
const fileNameHelper = require('./utils/file-name-helper');
const Register = require('./components/pages/register.jsx');
const EditMenu = require('./components/pages/edit-menu.jsx');
const ClientSettings = require('./bootstrap/client-settings');
const ServerSettings = require('./bootstrap/server-settings');
const { resetServerContext } = require('react-beautiful-dnd');
const DocumentService = require('./services/document-service');
const ResetPassword = require('./components/pages/reset-password.jsx');
const needsPermission = require('./domain/needs-permission-middleware');
const sessionsStoreSpec = require('./stores/collection-specs/sessions');
const CompleteRegistration = require('./components/pages/complete-registration.jsx');
const CompletePasswordReset = require('./components/pages/complete-password-reset.jsx');

const LANGUAGE = 'de';

const renderPageTemplate = ({ bundleName, request, user, initialState, clientSettings, html }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ELMU</title>
    <link rel="stylesheet" href="/main.css">
  </head>
  <body>
    <div id="root">${html}</div>
    <script>
      window.__user__ = ${htmlescape(user)};
      window.__request__ = ${htmlescape(request)};
      window.__language__ = ${htmlescape(LANGUAGE)};
      window.__settings__ = ${htmlescape(clientSettings)};
      window.__initalState__ = ${htmlescape(initialState)};
    </script>
    <script src="/commons.js"></script>
    <script src="/${bundleName}.js"></script>
  </body>
</html>
`;

function mapDocMetadata(doc) {
  return {
    key: doc._id,
    title: doc.title,
    slug: doc.slug,
    createdOn: doc.createdOn,
    updatedOn: doc.updatedOn,
    createdBy: doc.createdBy,
    updatedBy: doc.updatedBy
  };
}

function mapDocToInitialState({ doc }) {
  return {
    doc: mapDocMetadata(doc),
    sections: doc.sections
  };
}

function mapDocsMetadataToInitialState({ docs }) {
  return {
    docs: docs.map(mapDocMetadata)
  };
}

function mapMenuToInitialState({ menu }) {
  return { menu };
}

function visitMenuNodes(nodes, cb) {
  nodes.forEach(rootNode => treeCrawl(rootNode, cb, { getChildren: node => node.children }));
}

const jsonParser = bodyParser.json();
const multipartParser = multer({ dest: os.tmpdir() });

class ElmuServer {
  static get inject() { return [Container, ServerSettings, ClientSettings, ApiFactory, DocumentService, MenuService, UserService, MailService, Cdn, Database]; }

  /* eslint-disable-next-line no-warning-comments */
  // TODO: Refactor!
  /* eslint-disable-next-line max-params */
  constructor(container, serverSettings, clientSettings, apiFactory, documentService, menuService, userService, mailService, cdn, database) {
    this.container = container;
    this.serverSettings = serverSettings;
    this.clientSettings = clientSettings;
    this.apiFactory = apiFactory;
    this.documentService = documentService;
    this.menuService = menuService;
    this.userService = userService;
    this.mailService = mailService;
    this.cdn = cdn;

    this.app = express();

    this.app.enable('trust proxy');

    ['../dist', '../static']
      .map(dir => path.join(__dirname, dir))
      .forEach(dir => this.app.use(express.static(dir)));

    this.app.use(session({
      name: 'SID',
      secret: this.serverSettings.sessionSecret,
      resave: false,
      saveUninitialized: false, // Don't create session until something stored
      store: new MongoStore({
        db: database._db,
        collection: sessionsStoreSpec.name,
        ttl: this.serverSettings.sessionDurationInMinutes * 60,
        autoRemove: 'disabled', // We use our own index
        stringify: false // Do not serialize session data
      })
    }));

    this.app.use(passport.initialize());
    this.app.use(passport.session());

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

    this.app.get('/register', (req, res) => {
      return this._sendPage(req, res, 'register', Register, {});
    });

    this.app.get('/reset-password', (req, res) => {
      return this._sendPage(req, res, 'reset-password', ResetPassword, {});
    });

    this.app.get('/complete-registration/:verificationCode', async (req, res) => {
      const user = await this.userService.verifyUser(req.params.verificationCode);
      if (!user) {
        return res.sendStatus(404);
      }

      return this._sendPage(req, res, 'complete-registration', CompleteRegistration, {});
    });

    this.registerPages();
    this.registerCoreApi();
    this.registerPluginApis();

    // Finally, log any errors
    this.app.use((err, req, res, next) => {
      /* eslint-disable-next-line no-console */
      console.error(err);
      next(err);
    });
  }

  registerPages() {
    this.app.get('/', (req, res) => {
      return this._sendPage(req, res, 'index', Index, {});
    });

    this.app.get('/login', (req, res) => {
      return this._sendPage(req, res, 'login', Login, {});
    });

    this.app.get('/logout', (req, res) => {
      req.logout();
      return res.redirect(urls.getDefaultLogoutRedirectUrl());
    });

    this.app.get('/complete-password-reset/:passwordResetRequestId', async (req, res) => {
      const resetRequest = await this.userService.getPasswordResetRequestById(req.params.passwordResetRequestId);
      if (!resetRequest) {
        return res.sendStatus(404);
      }

      const initialState = { passwordResetRequestId: resetRequest._id };
      return this._sendPage(req, res, 'complete-password-reset', CompletePasswordReset, initialState);
    });

    this.app.get('/articles/:slug', async (req, res) => {
      const doc = await this.documentService.getDocumentBySlug(req.params.slug);
      if (!doc) {
        return res.sendStatus(404);
      }

      const initialState = mapDocToInitialState({ doc });
      return this._sendPage(req, res, 'article', Article, initialState);
    });

    this.app.get('/menus/:slug', async (req, res) => {
      const menu = await this.menuService.getMenuBySlug(req.params.slug);
      if (!menu) {
        return res.sendStatus(404);
      }

      const defaultDocument = menu.defaultDocumentKey
        ? await this.documentService.getDocumentById(menu.defaultDocumentKey)
        : null;

      const docKeys = new Set();
      docKeys.add(menu.defaultDocumentKey);
      visitMenuNodes(menu.nodes, node => (node.documentKeys || []).forEach(key => docKeys.add(key)));

      const docs = await this.documentService.getDocumentsMetadata(Array.from(docKeys));

      const initialState = {
        ...mapMenuToInitialState({ menu }),
        ...mapDocsMetadataToInitialState({ docs }),
        defaultDocument: defaultDocument ? mapDocToInitialState({ doc: defaultDocument }) : null
      };
      return this._sendPage(req, res, 'menu', Menu, initialState);
    });

    this.app.get('/docs', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const initialState = await this.documentService.getLastUpdatedDocuments();
      return this._sendPage(req, res, 'docs', Docs, initialState);
    });

    this.app.get('/docs/:docId', needsPermission(permissions.VIEW_DOCS), async (req, res) => {
      const doc = await this.documentService.getDocumentById(req.params.docId);
      if (!doc) {
        return res.sendStatus(404);
      }

      const initialState = mapDocToInitialState({ doc });
      return this._sendPage(req, res, 'doc', Doc, initialState);
    });

    this.app.get('/edit/doc/:docId', needsPermission(permissions.EDIT_DOC), async (req, res) => {
      const doc = await this.documentService.getDocumentById(req.params.docId);
      if (!doc) {
        return res.sendStatus(404);
      }

      const initialState = mapDocToInitialState({ doc });
      return this._sendPage(req, res, 'edit', Edit, initialState);
    });

    this.app.get('/menus', needsPermission(permissions.VIEW_MENUS), async (req, res) => {
      const initialState = await this.menuService.getMenus();
      return this._sendPage(req, res, 'menus', Menus, initialState);
    });

    this.app.get('/edit/menu/:menuId', needsPermission(permissions.EDIT_MENU), async (req, res) => {
      const menu = await this.menuService.getMenuById(req.params.menuId);
      if (!menu) {
        return res.sendStatus(404);
      }

      const docs = await this.documentService.getDocumentsMetadata();

      const initialState = {
        ...mapMenuToInitialState({ menu }),
        ...mapDocsMetadataToInitialState({ docs })
      };
      return this._sendPage(req, res, 'edit-menu', EditMenu, initialState);
    });

    this.app.get('/users', needsPermission(permissions.EDIT_USERS), async (req, res) => {
      const initialState = await this.userService.getAllUsers();
      return this._sendPage(req, res, 'users', Users, initialState);
    });
  }

  registerCoreApi() {
    this.app.post('/api/v1/users', jsonParser, async (req, res) => {
      const { username, password, email } = req.body;
      const user = await this.userService.createUser(username, password, email);
      const { origin } = requestHelper.getHostInfo(req);
      const verificationLink = urls.concatParts(origin, urls.getCompleteRegistrationUrl(user.verificationCode));
      await this.mailService.sendRegistrationVerificationLink(email, verificationLink);
      res.send({ user: this.userService.dbUserToClientUser(user) });
    });

    this.app.post('/api/v1/users/request-password-reset', jsonParser, async (req, res) => {
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

    this.app.post('/api/v1/users/complete-password-reset', jsonParser, async (req, res) => {
      const { passwordResetRequestId, password } = req.body;
      const user = await this.userService.completePasswordResetRequest(passwordResetRequestId, password);
      return res.send({ user: user || null });
    });

    this.app.post('/api/v1/users/login', jsonParser, (req, res, next) => {
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

          return res.send({ user: this.userService.dbUserToClientUser(user) });
        });
      })(req, res, next);
    });

    this.app.post('/api/v1/users/:userId/roles', [needsPermission(permissions.EDIT_USERS), jsonParser], async (req, res) => {
      const { userId } = req.params;
      const { roles } = req.body;
      const newRoles = await this.userService.updateUserRoles(userId, roles);
      return res.send({ roles: newRoles });
    });

    this.app.post('/api/v1/users/:userId/lockedOut', [needsPermission(permissions.EDIT_USERS), jsonParser], async (req, res) => {
      const { userId } = req.params;
      const { lockedOut } = req.body;
      const newLockedOutState = await this.userService.updateUserLockedOutState(userId, lockedOut);
      return res.send({ lockedOut: newLockedOutState });
    });

    this.app.post('/api/v1/docs', [needsPermission(permissions.EDIT_DOC), jsonParser], async (req, res) => {
      const { user } = req;
      const { doc, sections } = req.body;
      const docRevision = await this.documentService.createDocumentRevision({ doc, sections, user });
      const initialState = mapDocToInitialState({ doc: docRevision });
      return res.send(initialState);
    });

    this.app.post('/api/v1/menus', [needsPermission(permissions.EDIT_MENU), jsonParser], async (req, res) => {
      const user = req.user;
      const menu = req.body;
      const updatedMenu = await this.menuService.saveMenu({ menu, user });
      const initialState = mapMenuToInitialState({ menu: updatedMenu });
      return res.send(initialState);
    });

    this.app.get('/api/v1/cdn/objects', [needsPermission(permissions.VIEW_FILES), jsonParser], async (req, res) => {
      const prefix = req.query.prefix;
      const recursive = parseBool(req.query.recursive);
      const objects = await this.cdn.listObjects({ prefix, recursive });
      return res.send({ objects });
    });

    this.app.post('/api/v1/cdn/objects', [needsPermission(permissions.CREATE_FILE), multipartParser.array('files')], async (req, res) => {
      if (req.files && req.files.length) {
        const uploads = req.files.map(file => {
          const fileName = urls.concatParts(req.body.prefix, file.originalname);
          const uniqueFileName = fileNameHelper.makeUnique(fileName);
          return this.cdn.uploadObject(uniqueFileName, file.path, {});
        });
        await Promise.all(uploads);
      } else if (req.body.prefix && req.body.prefix[req.body.prefix.length - 1] === '/') {
        // If no file but a prefix ending with `/` is provided, create a folder instead of a file:
        this.cdn.uploadEmptyObject(req.body.prefix, {});
      }

      return res.send({});
    });
  }

  registerPluginApis() {
    this.apis = this.apiFactory.getRegisteredTypes().map(pluginType => {
      const router = express.Router();
      const pathPrefix = urls.getPluginApiPathPrefix(pluginType);
      const api = this.apiFactory.createApi(pluginType, pathPrefix);
      api.registerRoutes(router);
      this.app.use(pathPrefix, router);
      return api;
    });
  }

  _sendPage(req, res, bundleName, PageComponent, initialState) {
    const language = LANGUAGE;
    const { container, clientSettings } = this;
    const request = requestHelper.expressReqToRequest(req);
    const user = this.userService.dbUserToClientUser(req.user);
    const props = {
      request: JSON.parse(JSON.stringify(request)),
      user: JSON.parse(JSON.stringify(user)),
      container: container,
      initialState: JSON.parse(JSON.stringify(initialState)),
      language: language,
      PageComponent: PageComponent
    };
    const elem = React.createElement(Root, props);
    resetServerContext();
    const html = ReactDOMServer.renderToString(elem);
    const pageHtml = renderPageTemplate({ bundleName, request, user, initialState, clientSettings, html });
    return res.type('html').send(pageHtml);
  }

  listen(cb) {
    return this.app.listen(this.serverSettings.port, err => err ? cb(err) : cb(null, this.serverSettings.port));
  }
}

module.exports = ElmuServer;
