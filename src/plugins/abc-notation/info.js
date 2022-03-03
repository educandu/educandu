import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import AbcNotationIcon from './abc-notation-icon.js';

export default class AbcNotation {
  static get typeName() { return 'abc-notation'; }

  constructor() {
    this.type = 'abc-notation';
  }

  getName(t) {
    return t('abcNotation:name');
  }

  getIcon() {
    return <AbcNotationIcon />;
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
