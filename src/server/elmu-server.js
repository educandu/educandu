const util = require('util');
const express = require('express');
const Logger = require('../common/logger');
const ControllerFactory = require('./controller-factory');
const ServerSettings = require('../bootstrap/server-settings');

const logger = new Logger(__filename);

class ElmuServer {
  static get inject() { return [ServerSettings, ControllerFactory]; }

  constructor(serverSettings, controllerFactory) {
    this.serverSettings = serverSettings;

    this.server = null;

    this.app = express();

    this.app.on('error', err => logger.error(err));

    this.app.enable('trust proxy');

    logger.info('Registering healthcheck');
    this.app.use((req, res, next) => req.path === '/healthcheck' ? res.send('OK') : next());

    if (this.serverSettings.redirectToHttps) {
      logger.info('Registering redirect to HTTPS');
      this.app.use((req, res, next) => req.secure ? next() : res.redirect(301, `https://${req.headers.host}${req.originalUrl}`));
    }

    if (this.serverSettings.redirectToNonWwwDomain) {
      logger.info('Registering redirect to domain name without www');
      this.app.use((req, res, next) => (/^www\./).test(req.headers.host) ? res.redirect(301, `${req.protocol}://${req.headers.host.replace(/^www\./, '')}${req.originalUrl}`) : next());
    }

    const controllers = controllerFactory.getAllControllers();

    logger.info('Registering middlewares');
    controllers.filter(c => c.registerMiddleware).forEach(c => c.registerMiddleware(this.app));

    logger.info('Registering pages');
    controllers.filter(c => c.registerPages).forEach(c => c.registerPages(this.app));

    logger.info('Registering APIs');
    controllers.filter(c => c.registerApi).forEach(c => c.registerApi(this.app));

    logger.info('Registering error handlers');
    controllers.filter(c => c.registerErrorHandler).forEach(c => c.registerErrorHandler(this.app));
  }

  listen(cb) {
    if (this.server) {
      logger.info('Cannot start server, it is already listining');
      Promise.resolve().then(() => cb(null, this.serverSettings.port));
    } else {
      logger.info('Starting server');
      this.server = this.app.listen(this.serverSettings.port, err => err ? cb(err) : cb(null, this.serverSettings.port));
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

module.exports = ElmuServer;
