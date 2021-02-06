import { Container } from '../common/di';
import AudioPlugin from './audio/editor';
import VideoPlugin from './video/editor';
import ImagePlugin from './image/editor';
import IframePlugin from './iframe/editor';
import AnavisPlugin from './anavis/editor';
import MarkdownPlugin from './markdown/editor';
import H5pPlayerPlugin from './h5p-player/editor';
import AnnotationPlugin from './annotation/editor';
import DiagramNetPlugin from './diagram-net/editor';
import ImageTilePlugin from './image-tiles/editor.js';
import PluginFactoryBase from './plugin-factory-base';
import QuickTesterPlugin from './quick-tester/editor';
import AbcNotationPlugin from './abc-notation/editor';
import EarTrainingPlugin from './ear-training/editor';
import IntervalTrainerPlugin from './interval-trainer/editor';

const editors = [
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
  DiagramNetPlugin,
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

export default EditorFactory;
