import AudioPlugin from './audio/info.js';
import VideoPlugin from './video/info.js';
import ImagePlugin from './image/info.js';
import IframePlugin from './iframe/info.js';
import AnavisPlugin from './anavis/info.js';
import { Container } from '../common/di.js';
import MarkdownPlugin from './markdown/info.js';
import ImageTilePlugin from './image-tiles/info.js';
import AnnotationPlugin from './annotation/info.js';
import DiagramNetPlugin from './diagram-net/info.js';
import QuickTesterPlugin from './quick-tester/info.js';
import AbcNotationPlugin from './abc-notation/info.js';
import EarTrainingPlugin from './ear-training/info.js';
import PluginFactoryBase from './plugin-factory-base.js';
import IntervalTrainerPlugin from './interval-trainer/info.js';

const infos = [
  MarkdownPlugin,
  QuickTesterPlugin,
  AudioPlugin,
  VideoPlugin,
  ImagePlugin,
  IframePlugin,
  AnavisPlugin,
  ImageTilePlugin,
  AnnotationPlugin,
  DiagramNetPlugin,
  AbcNotationPlugin,
  EarTrainingPlugin,
  IntervalTrainerPlugin
];

class InfoFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container);
    infos.forEach(info => this.registerPlugin(info));
  }

  tryCreateInfo(pluginType) {
    return this._tryGetInstance(pluginType);
  }

  createInfo(pluginType) {
    return this._getInstance(pluginType);
  }
}

export default InfoFactory;
