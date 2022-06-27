import React from 'react';
import ImageIcon from './image-icon.js';
import ImageDisplay from './image-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';

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

  getDisplayComponent() {
    return ImageDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./image-editor.js')).default;
  }

  getDefaultContent() {
    return {
      sourceType: IMAGE_SOURCE_TYPE.internal,
      sourceUrl: '',
      width: 100,
      text: '',
      effect: null
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    if (redactedContent.sourceType === IMAGE_SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    if (redactedContent.effect?.sourceType === IMAGE_SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.effect.sourceUrl, targetRoomId)) {
      redactedContent.effect.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const resources = [];
    if (content.sourceType === IMAGE_SOURCE_TYPE.internal && content.sourceUrl) {
      resources.push(content.sourceUrl);
    }
    if (content.effect?.sourceType === IMAGE_SOURCE_TYPE.internal && content.effect.sourceUrl) {
      resources.push(content.effect.sourceUrl);
    }
    return [...new Set(resources)];
  }
}

export default ImageInfo;
