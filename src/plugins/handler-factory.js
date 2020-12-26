import { Container } from '../common/di';
import H5pPlayerPlugin from './h5p-player/handler';
import PluginFactoryBase from './plugin-factory-base';

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

export default HandlerFactory;
