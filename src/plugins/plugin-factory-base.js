class PluginFactoryBase {
  constructor(container, plugins) {
    this.factories = plugins.reduce((map, plugin) => {
      map.set(plugin.typeName, () => container.get(plugin));
      return map;
    }, new Map());
  }

  getRegisteredTypes() {
    return Array.from(this.factories.keys());
  }

  _getInstance(pluginType) {
    const factory = this.factories.get(pluginType);
    return factory && factory();
  }
}

export default PluginFactoryBase;
