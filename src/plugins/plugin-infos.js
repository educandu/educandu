import markdown from './markdown/info';
import anavis from './anavis/info';
import image from './image/info';
import iframe from './iframe/info';
import imageTiles from './image-tiles/info';
import audio from './audio/info';
import video from './video/info';
import quickTester from './quick-tester/info';
import annotation from './annotation/info';
import intervalTrainer from './interval-trainer/info';
import earTraining from './ear-training/info';
import abcNotation from './abc-notation/info';
import diagramNet from './diagram-net/info';

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

export default pluginInfos;
