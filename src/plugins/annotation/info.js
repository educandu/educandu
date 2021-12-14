import cloneDeep from '../../utils/clone-deep.js';

export default class Annotation {
  static get typeName() { return 'annotation'; }

  constructor() {
    this.type = 'annotation';
  }

  getName(t) {
    return t('annotation:name');
  }

  getDefaultContent() {
    return {
      title: '',
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
