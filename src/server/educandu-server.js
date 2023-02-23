import util from 'node:util';
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import routes from '../utils/routes.js';
import Logger from '../common/logger.js';
import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import basicAuth from 'express-basic-auth';
import Database from '../stores/database.js';
import requestUtils from '../utils/request-utils.js';
import ControllerFactory from './controller-factory.js';
import ServerConfig from '../bootstrap/server-config.js';
import { COOKIE_SAME_SITE_POLICY } from '../domain/constants.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../common/di.js';
import sessionsStoreSpec from '../stores/collection-specs/sessions.js';
import { generateSessionId, isSessionValid } from '../utils/session-utils.js';

import 'express-async-errors';

const logger = new Logger(import.meta.url);

const SYMBOL_MAINTENACE = Symbol('SYMBOL_MAINTENACE');

export default class EducanduServer {
  static dependencies = [ServerConfig, ControllerFactory, Database];

  constructor(serverConfig, controllerFactory, database) {
    this.serverConfig = serverConfig;
    this.controllerFactory = controllerFactory;
    this.database = database;

    this.server = null;

    this.app = express();

    this.app.on('error', err => logger.error(err));

    this.app.set('trust proxy', this.serverConfig.trustProxy);

    const router = express.Router();
    this.app.use('/', router);

    logger.info('Registering healthcheck');
    this.registerHealthcheck(router);

    logger.info('Registering permanent redirects');
    this.registerPermanentRedirects(router);

    logger.info('Registering user agent middleware');
    router.use(useragent.express());

    logger.info('Registering cookie parser middleware');
    router.use(cookieParser());

    logger.info('Registering maintenance middleware');
    this.registerMaintenanceMiddleware(router);

    logger.info('Registering session middleware');
    this.registerSessionMiddleware(router);

    const controllers = this.controllerFactory.getAllControllers();

    logger.info('Registering controller middlewares');
    controllers.filter(c => c.registerMiddleware).forEach(c => c.registerMiddleware(router));

    logger.info('Registering APIs');
    controllers.filter(c => c.registerApi).forEach(c => c.registerApi(router));

    logger.info('Registering basic auth middleware');
    this.registerBasicAuthMiddleware(router);

    logger.info('Registering  pages');
    controllers.filter(c => c.registerPages).forEach(c => c.registerPages(router));

    logger.info('Registering error handlers');
    controllers.filter(c => c.registerErrorHandler).forEach(c => c.registerErrorHandler(router));
  }

  registerHealthcheck(router) {
    router.get('/healthcheck', (req, res) => {
      return res.send({
        status: 'OK',
        mode: req.app.locals[SYMBOL_MAINTENACE] ? 'maintenance' : 'ready'
      });
    });
  }

  registerPermanentRedirects(router) {
    router.get('/lessons/:id', (req, res) => res.redirect(301, routes.getDocUrl({ id: req.params.id })));
    router.get('/revs/articles/:id', (req, res) => res.redirect(301, routes.getDocumentRevisionUrl(req.params.id)));
  }

  registerMaintenanceMiddleware(router) {
    router.use((req, res, next) => {
      if (!req.app.locals[SYMBOL_MAINTENACE]) {
        return next();
      }

      const message = 'Application is in maintenance mode. Please try again later.';
      return req.accepts(['json', 'html']) === 'json'
        ? res.status(503).json({ message })
        : res.status(503).type('html').send(`<!DOCTYPE html><p>${message}</p>`);
    });
  }

  registerBasicAuthMiddleware(router) {
    if (Object.keys(this.serverConfig.basicAuthUsers).length) {
      router.use(basicAuth({
        users: this.serverConfig.basicAuthUsers,
        challenge: true
      }));
    }
  }

  registerSessionMiddleware(router) {
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

    router.use((req, _res, next) => {
      return isSessionValid(req, this.serverConfig)
        ? next()
        : req.session.regenerate(next);
    });

    if (!this.serverConfig.sessionCookieDomain) {
      router.use((req, _res, next) => {
        if (req.session?.cookie) {
          const { domain } = requestUtils.getHostInfo(req);
          req.session.cookie.domain = domain;
        }

        next();
      });
    }
  }

  exitMaintenanceMode() {
    this.app.locals[SYMBOL_MAINTENACE] = false;
  }

  listen({ maintenance = false }) {
    this.app.locals[SYMBOL_MAINTENACE] = !!maintenance;
    return new Promise((resolve, reject) => {
      const { port } = this.serverConfig;
      if (this.server) {
        logger.info('Cannot start server, it is already listening');
        resolve(port);
      } else {
        logger.info('Starting server');
        this.server = this.app.listen(port, err => err ? reject(err) : resolve(port));
      }
    });
  }

  async close() {
    if (this.server) {
      logger.info('Closing server');
      await util.promisify(this.server.close.bind(this.server))();
      this.server = null;
      logger.info('Server successfully closed');
    }
  }

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.server,
      dispose: () => this.close()
    };
  }
}
