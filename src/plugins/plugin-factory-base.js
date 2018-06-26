const { Factory } = require('../common/di');

class PluginFactoryBase {
  constructor(container, plugins) {
    this.factories = plugins.reduce((map, plugin) => {
      map.set(plugin.typeName, container.get(Factory.of(plugin)));
      return map;
    }, new Map());
  }

  getRegisteredTypes() {
    return Array.from(this.factories.keys());
  }

  _createInstance(pluginType, ...args) {
    const factory = this.factories.get(pluginType);
    return factory && factory(...args);
  }
}

module.exports = PluginFactoryBase;
