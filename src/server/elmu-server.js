const express = require('express');
const ControllerFactory = require('./controller-factory');
const ServerSettings = require('../bootstrap/server-settings');

class ElmuServer {
  static get inject() { return [ServerSettings, ControllerFactory]; }

  constructor(serverSettings, controllerFactory) {
    this.serverSettings = serverSettings;

    this.app = express();

    this.app.enable('trust proxy');

    this.app.use((req, res, next) => req.path === '/healthcheck' ? res.send('OK') : next());

    if (this.serverSettings.redirectToHttps) {
      this.app.use((req, res, next) => req.secure ? next() : res.redirect(301, `https://${req.headers.host}${req.originalUrl}`));
    }

    if (this.serverSettings.redirectToNonWwwDomain) {
      this.app.use((req, res, next) => (/^www\./).test(req.headers.host) ? res.redirect(301, `${req.protocol}://${req.headers.host.replace(/^www\./, '')}${req.originalUrl}`) : next());
    }

    const controllers = controllerFactory.getAllControllers();

    controllers.filter(c => c.registerMiddleware).forEach(c => c.registerMiddleware(this.app));
    controllers.filter(c => c.registerPages).forEach(c => c.registerPages(this.app));
    controllers.filter(c => c.registerApi).forEach(c => c.registerApi(this.app));
    controllers.filter(c => c.registerErrorHandler).forEach(c => c.registerErrorHandler(this.app));
  }

  listen(cb) {
    return this.app.listen(this.serverSettings.port, err => err ? cb(err) : cb(null, this.serverSettings.port));
  }
}

module.exports = ElmuServer;
