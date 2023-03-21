import Logger from '../common/logger.js';
import AudioInfo from './audio/audio-info.js';
import VideoInfo from './video/video-info.js';
import ImageInfo from './image/image-info.js';
import TableInfo from './table/table-info.js';
import IframeInfo from './iframe/iframe-info.js';
import CatalogInfo from './catalog/catalog-info.js';
import RegisteredPlugin from './registered-plugin.js';
import MarkdownInfo from './markdown/markdown-info.js';
import SeparatorInfo from './separator/separator-info.js';
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
import MusicLearningBlockInfo from './music-learning-block/music-learning-block-info.js';

// Preload all built-in display components:
import AudioDisplay from './audio/audio-display.js';
import VideoDisplay from './video/video-display.js';
import ImageDisplay from './image/image-display.js';
import TableDisplay from './table/table-display.js';
import IframeDisplay from './iframe/iframe-display.js';
import CatalogDisplay from './catalog/catalog-display.js';
import MarkdownDisplay from './markdown/markdown-display.js';
import SeparatorDisplay from './separator/separator-display.js';
import PdfViewerDisplay from './pdf-viewer/pdf-viewer-display.js';
import AnnotationDisplay from './annotation/annotation-display.js';
import DiagramNetDisplay from './diagram-net/diagram-net-display.js';
import QuickTesterDisplay from './quick-tester/quick-tester-display.js';
import AbcNotationDisplay from './abc-notation/abc-notation-display.js';
import EarTrainingDisplay from './ear-training/ear-training-display.js';
import AudioWaveformDisplay from './audio-waveform/audio-waveform-display.js';
import MediaAnalysisDisplay from './media-analysis/media-analysis-display.js';
import MatchingCardsDisplay from './matching-cards/matching-cards-display.js';
import MediaSlideshowDisplay from './media-slideshow/media-slideshow-display.js';
import MusicXmlViewerDisplay from './music-xml-viewer/music-xml-viewer-display.js';
import MultitrackMediaDisplay from './multitrack-media/multitrack-media-display.js';
import TableOfContentsDisplay from './table-of-contents/table-of-contents-display.js';
import InteractiveMediaDisplay from './interactive-media/interactive-media-display.js';
import MarkdownWithImageDisplay from './markdown-with-image/markdown-with-image-display.js';
import MusicLearningBlockDisplay from './music-learning-block/music-learning-block-display.js';

const builtInDisplayComponentMap = {
  [AudioInfo.typeName]: AudioDisplay,
  [VideoInfo.typeName]: VideoDisplay,
  [ImageInfo.typeName]: ImageDisplay,
  [TableInfo.typeName]: TableDisplay,
  [IframeInfo.typeName]: IframeDisplay,
  [CatalogInfo.typeName]: CatalogDisplay,
  [MarkdownInfo.typeName]: MarkdownDisplay,
  [PdfViewerInfo.typeName]: PdfViewerDisplay,
  [SeparatorInfo.typeName]: SeparatorDisplay,
  [AnnotationInfo.typeName]: AnnotationDisplay,
  [DiagramNetInfo.typeName]: DiagramNetDisplay,
  [QuickTesterInfo.typeName]: QuickTesterDisplay,
  [AbcNotationInfo.typeName]: AbcNotationDisplay,
  [EarTrainingInfo.typeName]: EarTrainingDisplay,
  [AudioWaveformInfo.typeName]: AudioWaveformDisplay,
  [MediaAnalysisInfo.typeName]: MediaAnalysisDisplay,
  [MatchingCardsInfo.typeName]: MatchingCardsDisplay,
  [MediaSlideshowInfo.typeName]: MediaSlideshowDisplay,
  [MusicXmlViewerInfo.typeName]: MusicXmlViewerDisplay,
  [TableOfContentsInfo.typeName]: TableOfContentsDisplay,
  [MultitrackMediaInfo.typeName]: MultitrackMediaDisplay,
  [InteractiveMediaInfo.typeName]: InteractiveMediaDisplay,
  [MarkdownWithImageInfo.typeName]: MarkdownWithImageDisplay,
  [MusicLearningBlockInfo.typeName]: MusicLearningBlockDisplay
};

const logger = new Logger(import.meta.url);

const builtInPluginInfos = [
  AudioInfo,
  VideoInfo,
  ImageInfo,
  TableInfo,
  IframeInfo,
  CatalogInfo,
  MarkdownInfo,
  PdfViewerInfo,
  SeparatorInfo,
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
  MarkdownWithImageInfo,
  MusicLearningBlockInfo
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
      const displayComponent = builtInDisplayComponentMap[type.typeName] || null;
      this.pluginMap.set(name, new RegisteredPlugin(name, info, displayComponent));
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
