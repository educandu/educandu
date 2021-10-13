import { Container } from '../common/di';
import PluginFactoryBase from './plugin-factory-base';

// Kann weg?
const apis = [];

class HandlerFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container, apis);
  }

  createHandler(pluginType) {
    return this._createInstance(pluginType);
  }
}

export default HandlerFactory;
