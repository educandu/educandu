class PluginFactoryBase {
  constructor(container) {
    this.container = container;
    this.factories = new Map();
  }

  getRegisteredTypes() {
    return [...this.factories.keys()];
  }

  registerPlugin(plugin) {
    this.factories.set(plugin.typeName, () => this.container.get(plugin));
  }

  _getInstance(pluginType) {
    const factory = this.factories.get(pluginType);
    if (!factory) {
      throw new Error(`Plugin type '${pluginType}' is not registered.`);
    }

    return factory();
  }
}

export default PluginFactoryBase;
