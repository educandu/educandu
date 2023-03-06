import Logger from '../common/logger.js';
import AudioInfo from './audio/audio-info.js';
import VideoInfo from './video/video-info.js';
import ImageInfo from './image/image-info.js';
import TableInfo from './table/table-info.js';
import IframeInfo from './iframe/iframe-info.js';
import CatalogInfo from './catalog/catalog-info.js';
import DividerInfo from './divider/divider-info.js';
import RegisteredPlugin from './registered-plugin.js';
import MarkdownInfo from './markdown/markdown-info.js';
import PdfViewerInfo from './pdf-viewer/pdf-viewer-info.js';
import AnnotationInfo from './annotation/annotation-info.js';
import DiagramNetInfo from './diagram-net/diagram-net-info.js';
import QuickTesterInfo from './quick-tester/quick-tester-info.js';
import AbcNotationInfo from './abc-notation/abc-notation-info.js';
import EarTrainingInfo from './ear-training/ear-training-info.js';
import AudioWaveformInfo from './audio-waveform/audio-waveform-info.js';
import MediaAnalysisInfo from './media-analysis/media-analysis-info.js';
import MatchingCardsInfo from './matching-cards/matching-cards-info.js';
import MediaSlideshowInfo from './media-slideshow/media-slideshow-info.js';
import MusicXmlViewerInfo from './music-xml-viewer/music-xml-viewer-info.js';
import MultitrackMediaInfo from './multitrack-media/multitrack-media-info.js';
import TableOfContentsInfo from './table-of-contents/table-of-contents-info.js';
import InteractiveMediaInfo from './interactive-media/interactive-media-info.js';
import MarkdownWithImageInfo from './markdown-with-image/markdown-with-image-info.js';

const logger = new Logger(import.meta.url);

const builtInPluginInfos = [
  AudioInfo,
  VideoInfo,
  ImageInfo,
  TableInfo,
  IframeInfo,
  CatalogInfo,
  DividerInfo,
  MarkdownInfo,
  PdfViewerInfo,
  AnnotationInfo,
  DiagramNetInfo,
  QuickTesterInfo,
  AbcNotationInfo,
  EarTrainingInfo,
  AudioWaveformInfo,
  MediaAnalysisInfo,
  MatchingCardsInfo,
  MediaSlideshowInfo,
  MusicXmlViewerInfo,
  TableOfContentsInfo,
  MultitrackMediaInfo,
  InteractiveMediaInfo,
  MarkdownWithImageInfo
];

class PluginRegistry {
  constructor() {
    this.pluginMap = new Map();
  }

  setPlugins(container, plugins, customResolvers) {
    for (const name of plugins) {
      logger.info(`Registering plugin '${name}'`);
      const customPluginInfos = customResolvers.resolveCustomPluginInfos?.() || [];
      const type = [...builtInPluginInfos, ...customPluginInfos].find(plugin => plugin.typeName === name);
      if (!type) {
        throw new Error(`Could not resolve plugin '${name}'`);
      }

      const info = container.get(type);
      this.pluginMap.set(name, new RegisteredPlugin(name, info));
    }
  }

  ensureAllComponentsAreLoaded() {
    return Promise.all([...this.pluginMap.values()]
      .flatMap(plugin => [
        plugin.ensureDisplayComponentIsLoaded(),
        plugin.ensureEditorComponentIsLoaded()
      ]));
  }

  getRegisteredPlugin(pluginName) {
    return this.pluginMap.get(pluginName);
  }

  getAllRegisteredPlugins() {
    return [...this.pluginMap.values()];
  }
}

export default PluginRegistry;
