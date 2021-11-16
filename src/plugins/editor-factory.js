import { Container } from '../common/di.js';
import AudioPlugin from './audio/editor.js';
import VideoPlugin from './video/editor.js';
import ImagePlugin from './image/editor.js';
import IframePlugin from './iframe/editor.js';
import AnavisPlugin from './anavis/editor.js';
import MarkdownPlugin from './markdown/editor.js';
import ImageTilePlugin from './image-tiles/editor.js';
import AnnotationPlugin from './annotation/editor.js';
import DiagramNetPlugin from './diagram-net/editor.js';
import PluginFactoryBase from './plugin-factory-base.js';
import QuickTesterPlugin from './quick-tester/editor.js';
import AbcNotationPlugin from './abc-notation/editor.js';
import EarTrainingPlugin from './ear-training/editor.js';
import IntervalTrainerPlugin from './interval-trainer/editor.js';

const editors = [
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

class EditorFactory extends PluginFactoryBase {
  static get inject() { return [Container]; }

  constructor(container) {
    super(container, editors);
  }

  createEditor(pluginType) {
    return this._getInstance(pluginType);
  }
}

export default EditorFactory;
