import image from './image/info.js';
import audio from './audio/info.js';
import video from './video/info.js';
import anavis from './anavis/info.js';
import iframe from './iframe/info.js';
import markdown from './markdown/info.js';
import annotation from './annotation/info.js';
import imageTiles from './image-tiles/info.js';
import diagramNet from './diagram-net/info.js';
import quickTester from './quick-tester/info.js';
import earTraining from './ear-training/info.js';
import abcNotation from './abc-notation/info.js';
import intervalTrainer from './interval-trainer/info.js';

const pluginInfos = [
  markdown,
  anavis,
  image,
  iframe,
  imageTiles,
  audio,
  video,
  quickTester,
  annotation,
  intervalTrainer,
  earTraining,
  abcNotation,
  diagramNet
];

export const pluginTypes = pluginInfos.map(info => info.type);

export const getPluginInfoByType = type => pluginInfos.find(info => info.type === type);

export default pluginInfos;
