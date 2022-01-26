import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { NumberOutlined } from '@ant-design/icons';

export default class AbcNotation {
  static get typeName() { return 'abc-notation'; }

  constructor() {
    this.type = 'abc-notation';
  }

  getName(t) {
    return t('abcNotation:name');
  }

  getIcon() {
    return <NumberOutlined />;
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
