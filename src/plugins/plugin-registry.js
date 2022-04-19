import Logger from '../common/logger.js';
import { Container } from '../common/di.js';
import AudioInfo from './audio/audio-info.js';
import VideoInfo from './video/video-info.js';
import ImageInfo from './image/image-info.js';
import TableInfo from './table/table-info.js';
import IframeInfo from './iframe/iframe-info.js';
import AnavisInfo from './anavis/anavis-info.js';
import MarkdownInfo from './markdown/markdown-info.js';
import { resolveAll } from '../utils/promise-utils.js';
import ClientConfig from '../bootstrap/client-config.js';
import PdfViewerInfo from './pdf-viewer/pdf-viewer-info.js';
import AnnotationInfo from './annotation/annotation-info.js';
import ImageTilesInfo from './image-tiles/image-tiles-info.js';
import DiagramNetInfo from './diagram-net/diagram-net-info.js';
import QuickTesterInfo from './quick-tester/quick-tester-info.js';
import AbcNotationInfo from './abc-notation/abc-notation-info.js';
import EarTrainingInfo from './ear-training/ear-training-info.js';
import IntervalTrainerInfo from './interval-trainer/interval-trainer-info.js';
import InteractiveMediaInfo from './interactive-media/interactive-media-info.js';

const logger = new Logger(import.meta.url);

const allPossibleInfoTypes = [
  AudioInfo,
  VideoInfo,
  ImageInfo,
  TableInfo,
  IframeInfo,
  AnavisInfo,
  MarkdownInfo,
  PdfViewerInfo,
  AnnotationInfo,
  ImageTilesInfo,
  DiagramNetInfo,
  QuickTesterInfo,
  AbcNotationInfo,
  EarTrainingInfo,
  IntervalTrainerInfo,
  InteractiveMediaInfo
];

class RegisteredPlugin {
  constructor(info) {
    this.info = info;
    this.displayComponent = this.info.getDisplayComponent();
    this.editorComponent = null;
  }

  async ensureEditorComponentIsResolved() {
    this.editorComponent = await this.info.resolveEditorComponent();
  }
}

class PluginRegistry {
  static get inject() { return [Container, ClientConfig]; }

  constructor(container, clientConfig) {
    this.pluginMap = clientConfig.plugins.reduce((map, typeName) => {
      const infoType = allPossibleInfoTypes.find(type => type.typeName === typeName);
      if (!infoType) {
        throw new Error(`Plugin type "${typeName}" is not available`);
      }

      logger.info(`Registering plugin type ${infoType.typeName}`);
      map.set(infoType.typeName, new RegisteredPlugin(container.get(infoType)));
      return map;
    }, new Map());
  }

  ensureAllEditorsAreLoaded() {
    return resolveAll([...this.pluginMap.values()].map(plugin => () => plugin.ensureEditorComponentIsResolved()));
  }

  getAllInfos() {
    return [...this.pluginMap.values()].map(plugin => plugin.info);
  }

  tryGetInfo(pluginType) {
    return this.pluginMap.get(pluginType)?.info;
  }

  getInfo(pluginType) {
    const info = this.tryGetInfo(pluginType);
    if (!info) {
      throw new Error(`Plugin type "${pluginType}" is not registered`);
    }

    return info;
  }

  tryGetDisplayComponent(pluginType) {
    return this.pluginMap.get(pluginType)?.displayComponent;
  }

  tryGetEditorComponent(pluginType) {
    return this.pluginMap.get(pluginType)?.editorComponent;
  }
}

export default PluginRegistry;
