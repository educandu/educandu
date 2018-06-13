const { Container } = require('../common/di');
const PluginFactoryBase = require('./plugin-factory-base');
const MarkdownPlugin = require('./markdown/server-renderer');
const QuickTesterPlugin = require('./quick-tester/server-renderer');
const YoutubeVideoPlugin = require('./youtube-video/server-renderer');

const renderers = [MarkdownPlugin, QuickTesterPlugin, YoutubeVideoPlugin];

class ServerRendererFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container, renderers);
  }

  createRenderer(pluginType, section) {
    return this._createInstance(pluginType, section);
  }
}

module.exports = ServerRendererFactory;
