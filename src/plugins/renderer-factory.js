const { Container } = require('../common/di');
const AudioPlugin = require('./audio/renderer');
const ImagePlugin = require('./image/renderer');
const MarkdownPlugin = require('./markdown/renderer');
const H5pPlayerPlugin = require('./h5p-player/renderer');
const PluginFactoryBase = require('./plugin-factory-base');
const QuickTesterPlugin = require('./quick-tester/renderer');
const YoutubeVideoPlugin = require('./youtube-video/renderer');
const CreditPlugin = require('./credit/renderer');

const renderers = [MarkdownPlugin, QuickTesterPlugin, YoutubeVideoPlugin, AudioPlugin, ImagePlugin, H5pPlayerPlugin, CreditPlugin];

class RendererFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container, renderers);
  }

  createRenderer(pluginType) {
    return this._createInstance(pluginType);
  }
}

module.exports = RendererFactory;
