import { Container } from '../common/di.js';
import { resolveAll } from '../utils/promise-utils.js';
import PluginFactoryBase from './plugin-factory-base.js';

const pluginImporters = [
  async () => (await import('./audio/editor.js')).default,
  async () => (await import('./video/editor.js')).default,
  async () => (await import('./image/editor.js')).default,
  async () => (await import('./iframe/editor.js')).default,
  async () => (await import('./anavis/editor.js')).default,
  async () => (await import('./markdown/editor.js')).default,
  async () => (await import('./image-tiles/editor.js')).default,
  async () => (await import('./annotation/editor.js')).default,
  async () => (await import('./diagram-net/editor.js')).default,
  async () => (await import('./quick-tester/editor.js')).default,
  async () => (await import('./abc-notation/editor.js')).default,
  async () => (await import('./ear-training/editor.js')).default,
  async () => (await import('./interval-trainer/editor.js')).default
];

class EditorFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  // eslint-disable-next-line no-useless-constructor
  constructor(container) {
    super(container);
    this.areEditorsLoaded = false;
  }

  async ensureEditorsAreLoaded() {
    if (!this.areEditorsLoaded) {
      const editors = await resolveAll(pluginImporters);
      editors.forEach(editor => this.registerPlugin(editor));
      this.areEditorsLoaded = true;
    }
  }

  createEditor(pluginType) {
    return this._getInstance(pluginType);
  }
}

export default EditorFactory;
