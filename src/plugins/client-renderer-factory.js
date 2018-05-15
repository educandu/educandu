const { Container } = require('../common/di');
const PluginFactoryBase = require('./plugin-factory-base');
const MarkdownPlugin = require('./markdown/client-renderer');
const QuickTesterPlugin = require('./quick-tester/client-renderer');

const renderers = [MarkdownPlugin, QuickTesterPlugin];

class ClientRendererFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container, renderers);
  }

  createRenderer(pluginType, section, parentElement) {
    return this._createInstance(pluginType, section, parentElement);
  }
}

module.exports = ClientRendererFactory;
