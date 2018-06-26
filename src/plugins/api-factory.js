const { Container } = require('../common/di');
const H5pPlayerPlugin = require('./h5p-player/api');
const PluginFactoryBase = require('./plugin-factory-base');

const apis = [H5pPlayerPlugin];

class ApiFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container, apis);
  }

  createApi(pluginType, section) {
    return this._createInstance(pluginType, section);
  }
}

module.exports = ApiFactory;
