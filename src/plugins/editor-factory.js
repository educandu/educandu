const { Container } = require('../common/di');
const AudioPlugin = require('./audio/editor');
const VideoPlugin = require('./video/editor');
const ImagePlugin = require('./image/editor');
const MarkdownPlugin = require('./markdown/editor');
const H5pPlayerPlugin = require('./h5p-player/editor');
const AnnotationPlugin = require('./annotation/editor');
const PluginFactoryBase = require('./plugin-factory-base');
const QuickTesterPlugin = require('./quick-tester/editor');
const IntervalTrainerPlugin = require('./interval-trainer/editor');

const editors = [
  MarkdownPlugin,
  QuickTesterPlugin,
  AudioPlugin,
  VideoPlugin,
  ImagePlugin,
  H5pPlayerPlugin,
  AnnotationPlugin,
  IntervalTrainerPlugin
];

class EditorFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container, editors);
  }

  createEditor(pluginType) {
    return this._createInstance(pluginType);
  }
}

module.exports = EditorFactory;
