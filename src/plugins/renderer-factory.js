const { Container } = require('../common/di');
const AudioPlugin = require('./audio/renderer');
const MarkdownPlugin = require('./markdown/renderer');
const H5pPlayerPlugin = require('./h5p-player/renderer');
const PluginFactoryBase = require('./plugin-factory-base');
const QuickTesterPlugin = require('./quick-tester/renderer');
const YoutubeVideoPlugin = require('./youtube-video/renderer');

const renderers = [MarkdownPlugin, QuickTesterPlugin, YoutubeVideoPlugin, AudioPlugin, H5pPlayerPlugin];

class RendererFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container, renderers);
  }

  createRenderer(pluginType, section, parentElement) {
    return this._createInstance(pluginType, section, parentElement);
  }
}

module.exports = RendererFactory;
