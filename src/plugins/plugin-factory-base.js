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

  _tryGetInstance(pluginType) {
    const factory = this.factories.get(pluginType);
    return factory?.() || null;
  }

  _getInstance(pluginType) {
    const instance = this._tryGetInstance(pluginType);
    if (!instance) {
      throw new Error(`Plugin type '${pluginType}' is not registered.`);
    }

    return instance;
  }
}

export default PluginFactoryBase;
