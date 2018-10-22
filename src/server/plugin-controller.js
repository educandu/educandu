const express = require('express');
const urls = require('../utils/urls');
const ApiFactory = require('../plugins/api-factory');

class PluginController {
  static get inject() { return [ApiFactory]; }

  constructor(apiFactory) {
    this.apiFactory = apiFactory;
  }

  registerApi(app) {
    this.apis = this.apiFactory.getRegisteredTypes().map(pluginType => {
      const router = express.Router();
      const pathPrefix = urls.getPluginApiPathPrefix(pluginType);
      const api = this.apiFactory.createApi(pluginType, pathPrefix);
      api.registerRoutes(router);
      app.use(pathPrefix, router);
      return api;
    });
  }
}

module.exports = PluginController;
