const { Container } = require('../common/di');
const H5pPlayerPlugin = require('./h5p-player/handler');
const PluginFactoryBase = require('./plugin-factory-base');

const apis = [H5pPlayerPlugin];

class HandlerFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container, apis);
  }

  createHandler(pluginType) {
    return this._createInstance(pluginType);
  }
}

module.exports = HandlerFactory;
