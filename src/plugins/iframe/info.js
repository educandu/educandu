import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { GlobalOutlined } from '@ant-design/icons';

export default class Iframe {
  static get typeName() { return 'iframe'; }

  constructor() {
    this.type = 'iframe';
  }

  getName(t) {
    return t('iframe:name');
  }

  getIcon() {
    return <GlobalOutlined />;
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
