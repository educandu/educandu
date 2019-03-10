const { Container } = require('../common/di');
const AudioPlugin = require('./audio/renderer');
const VideoPlugin = require('./video/renderer');
const ImagePlugin = require('./image/renderer');
const MarkdownPlugin = require('./markdown/renderer');
const H5pPlayerPlugin = require('./h5p-player/renderer');
const AnnotationPlugin = require('./annotation/renderer');
const PluginFactoryBase = require('./plugin-factory-base');
const QuickTesterPlugin = require('./quick-tester/renderer');
const IntervalTrainerPlugin = require('./interval-trainer/renderer');

const renderers = [
  MarkdownPlugin,
  QuickTesterPlugin,
  AudioPlugin,
  VideoPlugin,
  ImagePlugin,
  H5pPlayerPlugin,
  AnnotationPlugin,
  IntervalTrainerPlugin
];

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
