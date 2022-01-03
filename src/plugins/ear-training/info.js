import { SOUND_TYPE, TESTS_ORDER } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';

export default class EarTraining {
  static get typeName() { return 'ear-training'; }

  constructor() {
    this.type = 'ear-training';
  }

  getName(t) {
    return t('earTraining:name');
  }

  getDefaultContent() {
    return {
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
      ],
      testsOrder: TESTS_ORDER.given
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources(content) {
    return content.tests.filter(test => test.sound?.type === SOUND_TYPE.internal && test.sound.url).map(test => test.sound.url);
  }
}
