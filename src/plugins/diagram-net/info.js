import cloneDeep from '../../utils/clone-deep.js';

export default class DiagramNet {
  static get typeName() { return 'diagram-net'; }

  constructor() {
    this.type = 'diagram-net';
  }

  getName(t) {
    return t('diagramNet:name');
  }

  getDefaultContent() {
    return {
      xml: null,
      image: null,
      maxWidth: 100
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources() {
    return [];
  }
}
