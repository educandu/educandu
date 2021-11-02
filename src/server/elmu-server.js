import util from 'util';
import express from 'express';
import Logger from '../common/logger.js';
import cookieParser from 'cookie-parser';
import ControllerFactory from './controller-factory.js';
import ServerConfig from '../bootstrap/server-config.js';

import 'express-async-errors';

const logger = new Logger(import.meta.url);

class ElmuServer {
  static get inject() { return [ServerConfig, ControllerFactory]; }

  constructor(serverConfig, controllerFactory) {
    this.serverConfig = serverConfig;

    this.server = null;

    this.app = express();

    this.app.on('error', err => logger.error(err));

    this.app.enable('trust proxy');

    this.app.use(cookieParser());

    const router = express.Router();
    this.app.use('/', router);

    logger.info('Registering healthcheck');
    router.use((req, res, next) => {
      if (req.path === '/healthcheck') {
        logger.info('Healthcheck was hit', req.headers);
        res.json({ status: 'OK' });
      } else {
        next();
      }
    });

    if (this.serverConfig.redirectToHttps) {
      logger.info('Registering redirect to HTTPS');
      router.use((req, res, next) => req.secure ? next() : res.redirect(301, `https://${req.headers.host}${req.originalUrl}`));
    }

    if (this.serverConfig.redirectToNonWwwDomain) {
      logger.info('Registering redirect to domain name without www');
      router.use((req, res, next) => (/^www\./).test(req.headers.host) ? res.redirect(301, `${req.protocol}://${req.headers.host.replace(/^www\./, '')}${req.originalUrl}`) : next());
    }

    const controllers = controllerFactory.getAllControllers();

    logger.info('Registering middlewares');
    controllers.filter(c => c.registerMiddleware).forEach(c => c.registerMiddleware(router));

    logger.info('Registering pages');
    controllers.filter(c => c.registerPages).forEach(c => c.registerPages(router));

    logger.info('Registering APIs');
    controllers.filter(c => c.registerApi).forEach(c => c.registerApi(router));

    logger.info('Registering error handlers');
    controllers.filter(c => c.registerErrorHandler).forEach(c => c.registerErrorHandler(router));
  }

  listen(cb) {
    if (this.server) {
      logger.info('Cannot start server, it is already listining');
      Promise.resolve().then(() => cb(null, this.serverConfig.port));
    } else {
      logger.info('Starting server');
      this.server = this.app.listen(this.serverConfig.port, err => err ? cb(err) : cb(null, this.serverConfig.port));
    }

    return this.server;
  }

  async dispose() {
    if (this.server) {
      logger.info('Closing server');
      await util.promisify(this.server.close.bind(this.server))();
      this.server = null;
      logger.info('Server successfully closed');
    } else {
      logger.info('Cannot close server, it is not listining');
      await Promise.resolve();
    }
  }
}

export default ElmuServer;
