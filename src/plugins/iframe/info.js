import React from 'react';
import iconNs from '@ant-design/icons';
import IframeIcon from './iframe-icon.js';
import cloneDeep from '../../utils/clone-deep.js';

const Icon = iconNs.default || iconNs;

export default class Iframe {
  static get typeName() { return 'iframe'; }

  constructor() {
    this.type = 'iframe';
  }

  getName(t) {
    return t('iframe:name');
  }

  getIcon() {
    return <Icon component={IframeIcon} />;
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
