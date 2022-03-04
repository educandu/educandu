import React from 'react';
import ImageIcon from './image-icon.js';
import { SOURCE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';

export default class Image {
  static get typeName() { return 'image'; }

  constructor() {
    this.type = 'image';
  }

  getName(t) {
    return t('image:name');
  }

  getIcon() {
    return <ImageIcon />;
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
