import util from 'util';
import express from 'express';
import Logger from '../common/logger.js';
import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import basicAuth from 'express-basic-auth';
import ControllerFactory from './controller-factory.js';
import ServerConfig from '../bootstrap/server-config.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../common/di.js';

import 'express-async-errors';

const logger = new Logger(import.meta.url);

const SYMBOL_MAINTENACE = Symbol('maintenance');

export default class EducanduServer {
  static get inject() { return [ServerConfig, ControllerFactory]; }

  constructor(serverConfig, controllerFactory) {
    this.serverConfig = serverConfig;
    this.controllerFactory = controllerFactory;

    this.server = null;

    this.app = express();

    this.app.on('error', err => logger.error(err));

    this.app.enable('trust proxy');

    this.app.use(useragent.express());

    this.app.use(cookieParser());

    const router = express.Router();
    this.app.use('/', router);

    logger.info('Registering healthcheck');
    router.use((req, res, next) => {
      if (req.path === '/healthcheck') {
        return res.send({
          status: 'OK',
          mode: req.app.locals[SYMBOL_MAINTENACE] ? 'maintenance' : 'ready'
        });
      }

      return next();
    });

    logger.info('Registering maintenance middleware');
    router.use((req, res, next) => {
      if (!req.app.locals[SYMBOL_MAINTENACE]) {
        return next();
      }

      const message = 'Application is in maintenance mode. Please try again later.';
      return req.accepts(['json', 'html']) === 'json'
        ? res.status(503).json({ message })
        : res.status(503).type('html').send(`<!DOCTYPE html><p>${message}</p>`);
    });

    if (Object.keys(this.serverConfig.basicAuthUsers).length) {
      router.use(/^\/(?!api\/)/, basicAuth({
        users: this.serverConfig.basicAuthUsers,
        challenge: true
      }));
    }

    logger.info('Rrgistering permanent redirects');
    this.controllerFactory.registerPermanentRedirects(router);

    this.controllerFactory.registerAdditionalControllers(this.serverConfig.additionalControllers);
    const controllers = this.controllerFactory.getAllControllers();

    logger.info('Registering middlewares');
    controllers.filter(c => c.registerMiddleware).forEach(c => c.registerMiddleware(router));

    logger.info('Registering pages');
    controllers.filter(c => c.registerPages).forEach(c => c.registerPages(router));

    logger.info('Registering APIs');
    controllers.filter(c => c.registerApi).forEach(c => c.registerApi(router));

    logger.info('Registering error handlers');
    controllers.filter(c => c.registerErrorHandler).forEach(c => c.registerErrorHandler(router));
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
