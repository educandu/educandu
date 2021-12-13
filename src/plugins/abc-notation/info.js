import cloneDeep from '../../utils/clone-deep.js';

export default class AbcNotation {
  static get typeName() { return 'abc-notation'; }

  constructor() {
    this.type = 'abc-notation';
  }

  getName(t) {
    return t('abcNotation:name');
  }

  getDefaultContent() {
    return {
      abcCode: '',
      maxWidth: 100,
      displayMidi: true,
      text: ''
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources() {
    return [];
  }
}
