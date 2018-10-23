const express = require('express');
const ControllerFactory = require('./controller-factory');
const ServerSettings = require('../bootstrap/server-settings');

class ElmuServer {
  static get inject() { return [ServerSettings, ControllerFactory]; }

  constructor(serverSettings, controllerFactory) {
    this.serverSettings = serverSettings;

    this.app = express();

    this.app.enable('trust proxy');

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
