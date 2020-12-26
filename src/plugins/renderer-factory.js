import { Container } from '../common/di';
import AudioPlugin from './audio/renderer';
import VideoPlugin from './video/renderer';
import ImagePlugin from './image/renderer';
import IframePlugin from './iframe/renderer';
import AnavisPlugin from './anavis/renderer';
import MarkdownPlugin from './markdown/renderer';
import H5pPlayerPlugin from './h5p-player/renderer';
import AnnotationPlugin from './annotation/renderer';
import ImageTilePlugin from './image-tiles/renderer';
import PluginFactoryBase from './plugin-factory-base';
import QuickTesterPlugin from './quick-tester/renderer';
import AbcNotationPlugin from './abc-notation/renderer';
import EarTrainingPlugin from './ear-training/renderer';
import IntervalTrainerPlugin from './interval-trainer/renderer';

const renderers = [
  MarkdownPlugin,
  QuickTesterPlugin,
  AudioPlugin,
  VideoPlugin,
  ImagePlugin,
  IframePlugin,
  AnavisPlugin,
  ImageTilePlugin,
  H5pPlayerPlugin,
  AnnotationPlugin,
  AbcNotationPlugin,
  EarTrainingPlugin,
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

export default RendererFactory;
