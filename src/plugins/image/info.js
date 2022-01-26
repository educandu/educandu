import React from 'react';
import { SOURCE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import { PictureOutlined } from '@ant-design/icons';

export default class Image {
  static get typeName() { return 'image'; }

  constructor() {
    this.type = 'image';
  }

  getName(t) {
    return t('image:name');
  }

  getIcon() {
    return <PictureOutlined />;
  }

  getDefaultContent() {
    return {
      sourceType: SOURCE_TYPE.internal,
      sourceUrl: '',
      maxWidth: 100,
      text: '',
      effect: null
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources(content) {
    const resources = [];
    if (content.sourceType === SOURCE_TYPE.internal && content.sourceUrl) {
      resources.push(content.sourceUrl);
    }
    if (content.effect?.sourceType === SOURCE_TYPE.internal && content.effect.sourceUrl) {
      resources.push(content.effect.sourceUrl);
    }
    return resources;
  }
}
