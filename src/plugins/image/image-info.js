import React from 'react';
import ImageIcon from './image-icon.js';
import { SOURCE_TYPE } from './constants.js';
import ImageDisplay from './image-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { isAccessibleStoragePath } from '../../ui/path-helper.js';

class ImageInfo {
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

  getDisplayComponentType() {
    return ImageDisplay;
  }

  async resolveEditorComponentType() {
    return (await import('./image-editor.js')).default;
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

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    if (redactedContent.sourceType === SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    if (redactedContent.effect?.sourceType === SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.effect.sourceUrl, targetRoomId)) {
      redactedContent.effect.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const resources = [];
    if (content.sourceType === SOURCE_TYPE.internal && content.sourceUrl) {
      resources.push(content.sourceUrl);
    }
    if (content.effect?.sourceType === SOURCE_TYPE.internal && content.effect.sourceUrl) {
      resources.push(content.effect.sourceUrl);
    }
    return [...new Set(resources)];
  }
}

export default ImageInfo;
