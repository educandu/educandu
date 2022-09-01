import React from 'react';
import CatalogIcon from './catalog-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import CatalogDisplay from './catalog-display.js';
import { createDefaultContent } from './catalog-utils.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';

export default class Catalog {
  static get typeName() { return 'catalog'; }

  constructor() {
    this.type = 'catalog';
  }

  getName(t) {
    return t('catalog:name');
  }

  getIcon() {
    return <CatalogIcon />;
  }

  getDisplayComponent() {
    return CatalogDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./catalog-editor.js')).default;
  }

  getDefaultContent(t) {
    return createDefaultContent(t);
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    for (const item of redactedContent.items) {
      if (item.image.sourceType === IMAGE_SOURCE_TYPE.internal && !isAccessibleStoragePath(item.image.sourceUrl, targetRoomId)) {
        item.image.sourceUrl = '';
      }
    }

    return redactedContent;
  }

  getCdnResources(content) {
    return content.items
      .filter(item => item.image.sourceType === IMAGE_SOURCE_TYPE.internal && item.image.sourceUrl)
      .map(item => item.image.sourceUrl);
  }
}
