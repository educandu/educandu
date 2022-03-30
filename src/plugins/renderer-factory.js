import { Container } from '../common/di.js';
import AudioPlugin from './audio/renderer.js';
import VideoPlugin from './video/renderer.js';
import ImagePlugin from './image/renderer.js';
import IframePlugin from './iframe/renderer.js';
import AnavisPlugin from './anavis/renderer.js';
import MarkdownPlugin from './markdown/renderer.js';
import PdfViewerPlugin from './pdf-viewer/renderer.js';
import AnnotationPlugin from './annotation/renderer.js';
import ImageTilePlugin from './image-tiles/renderer.js';
import DiagramNetPlugin from './diagram-net/renderer.js';
import PluginFactoryBase from './plugin-factory-base.js';
import QuickTesterPlugin from './quick-tester/renderer.js';
import AbcNotationPlugin from './abc-notation/renderer.js';
import EarTrainingPlugin from './ear-training/renderer.js';
import IntervalTrainerPlugin from './interval-trainer/renderer.js';

const renderers = [
  MarkdownPlugin,
  QuickTesterPlugin,
  AudioPlugin,
  VideoPlugin,
  ImagePlugin,
  PdfViewerPlugin,
  IframePlugin,
  AnavisPlugin,
  ImageTilePlugin,
  DiagramNetPlugin,
  AnnotationPlugin,
  AbcNotationPlugin,
  EarTrainingPlugin,
  IntervalTrainerPlugin
];

class RendererFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container);
    renderers.forEach(renderer => this.registerPlugin(renderer));
  }

  tryCreateRenderer(pluginType) {
    return this._tryGetInstance(pluginType);
  }

  createRenderer(pluginType) {
    return this._getInstance(pluginType);
  }
}

export default RendererFactory;
