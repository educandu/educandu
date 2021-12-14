import cloneDeep from '../../utils/clone-deep.js';

export default class Iframe {
  static get typeName() { return 'iframe'; }

  constructor() {
    this.type = 'iframe';
  }

  getName(t) {
    return t('iframe:name');
  }

  getDefaultContent() {
    return {
      url: '',
      width: 100,
      height: 150,
      isBorderVisible: true
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources() {
    return [];
  }
}
