import React from 'react';
import CatalogIcon from './catalog-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import CatalogDisplay from './catalog-display.js';
import { isInternalSourceType } from '../../utils/source-utils.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import { createDefaultContent, validateContent } from './catalog-utils.js';

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

  validateContent(content) {
    validateContent(content);
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    for (const item of redactedContent.items) {
      if (!isAccessibleStoragePath(item.image.sourceUrl, targetRoomId)) {
        item.image.sourceUrl = '';
      }
    }

    return redactedContent;
  }

  getCdnResources(content) {
    return content.items
      .map(item => item.image.sourceUrl)
      .filter(url => isInternalSourceType({ url }));
  }
}
