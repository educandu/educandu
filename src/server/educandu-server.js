import util from 'util';
import express from 'express';
import Logger from '../common/logger.js';
import cookieParser from 'cookie-parser';
import useragent from 'express-useragent';
import ControllerFactory from './controller-factory.js';
import ServerConfig from '../bootstrap/server-config.js';
import { getDisposalInfo, DISPOSAL_PRIORITY } from '../common/di.js';

import 'express-async-errors';

const logger = new Logger(import.meta.url);

class EducanduServer {
  static get inject() { return [ServerConfig, ControllerFactory]; }

  constructor(serverConfig, controllerFactory) {
    this.serverConfig = serverConfig;

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
        logger.info('Healthcheck was hit', req.headers);
        return res.json({ status: 'OK' });
      }

      return next();
    });

    controllerFactory.registerAdditionalControllers(serverConfig.additionalControllers);
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

  [getDisposalInfo]() {
    return {
      priority: DISPOSAL_PRIORITY.server,
      dispose: async () => {
        if (this.server) {
          logger.info('Closing server');
          await util.promisify(this.server.close.bind(this.server))();
          this.server = null;
          logger.info('Server successfully closed');
        } else {
          logger.info('Cannot close server, it is not listening');
          await Promise.resolve();
        }
      }
    };
  }
}

export default EducanduServer;
