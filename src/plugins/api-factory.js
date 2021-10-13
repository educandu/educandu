import { Container } from '../common/di';
import PluginFactoryBase from './plugin-factory-base';

const apis = [];

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
