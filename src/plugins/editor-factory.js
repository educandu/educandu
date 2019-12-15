const { Container } = require('../common/di');
const AudioPlugin = require('./audio/editor');
const VideoPlugin = require('./video/editor');
const AnavisPlugin = require('./anavis/editor');
const ImagePlugin = require('./image/editor');
const MarkdownPlugin = require('./markdown/editor');
const H5pPlayerPlugin = require('./h5p-player/editor');
const AnnotationPlugin = require('./annotation/editor');
const ImageTilePlugin = require('./image-tiles/editor.js');
const PluginFactoryBase = require('./plugin-factory-base');
const QuickTesterPlugin = require('./quick-tester/editor');
const AbcNotationPlugin = require('./abc-notation/editor');
const EarTrainingPlugin = require('./ear-training/editor');
const IntervalTrainerPlugin = require('./interval-trainer/editor');

const editors = [
  MarkdownPlugin,
  QuickTesterPlugin,
  AudioPlugin,
  VideoPlugin,
  AnavisPlugin,
  ImagePlugin,
  ImageTilePlugin,
  H5pPlayerPlugin,
  AnnotationPlugin,
  AbcNotationPlugin,
  EarTrainingPlugin,
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
