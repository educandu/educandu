import { Container } from '../common/di';
import H5pPlayerPlugin from './h5p-player/api';
import PluginFactoryBase from './plugin-factory-base';

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

export default ApiFactory;
