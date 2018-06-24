const { Container } = require('../common/di');
const AudioPlugin = require('./audio/editor');
const MarkdownPlugin = require('./markdown/editor');
const H5pPlayerPlugin = require('./h5p-player/editor');
const PluginFactoryBase = require('./plugin-factory-base');
const QuickTesterPlugin = require('./quick-tester/editor');
const YoutubeVideoPlugin = require('./youtube-video/editor');

const editors = [MarkdownPlugin, QuickTesterPlugin, YoutubeVideoPlugin, AudioPlugin, H5pPlayerPlugin];

class EditorFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container, editors);
  }

  createEditor(pluginType, section) {
    return this._createInstance(pluginType, section);
  }
}

module.exports = EditorFactory;
