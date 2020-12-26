import express from 'express';
import urls from '../utils/urls';
import ApiFactory from '../plugins/api-factory';

class PluginController {
  static get inject() { return [ApiFactory]; }

  constructor(apiFactory) {
    this.apiFactory = apiFactory;
  }

  registerApi(router) {
    this.apis = this.apiFactory.getRegisteredTypes().map(pluginType => {
      const pluginRouter = express.Router();
      const pathPrefix = urls.getPluginApiPathPrefix(pluginType);
      const api = this.apiFactory.createApi(pluginType, pathPrefix);
      api.registerRoutes(pluginRouter);
      router.use(pathPrefix, pluginRouter);
      return api;
    });
  }
}

export default PluginController;
