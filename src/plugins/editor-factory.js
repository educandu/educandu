const { Container } = require('../common/di');
const PluginFactoryBase = require('./plugin-factory-base');
const MarkdownPlugin = require('./markdown/editor');
const QuickTesterPlugin = require('./quick-tester/editor');

const editors = [MarkdownPlugin, QuickTesterPlugin];

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
