import { SOUND_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'ear-training',
  getName: t => t('earTraining:name'),
  getDefaultContent: () => ({
    title: '',
    maxWidth: 100,
    tests: [
      {
        startAbcCode: 'X:1',
        fullAbcCode: 'X:1',
        sound: {
          type: SOUND_TYPE.midi,
          url: null,
          text: null
        }
      }
    ]
  }),
  cloneContent: content => cloneDeep(content),
  getCdnResources: content => content.tests.filter(test => test.sound?.type === SOUND_TYPE.internal && test.sound.url).map(test => test.sound.url)
};
