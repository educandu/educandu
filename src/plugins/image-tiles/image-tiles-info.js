import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import ImageTilesIcon from './image-tiles-icon.js';
import ImageTilesDisplay from './image-tiles-display.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import { createDefaultContent } from './image-tiles-utils.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';

export default class ImageTiles {
  static get typeName() { return 'image-tiles'; }

  constructor() {
    this.type = 'image-tiles';
  }

  getName(t) {
    return t('imageTiles:name');
  }

  getIcon() {
    return <ImageTilesIcon />;
  }

  getDisplayComponent() {
    return ImageTilesDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./image-tiles-editor.js')).default;
  }

  getDefaultContent(t) {
    return createDefaultContent(t);
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    for (const tile of redactedContent.tiles) {
      if (tile.image?.sourceType === IMAGE_SOURCE_TYPE.internal && !isAccessibleStoragePath(tile.image.sourceUrl, targetRoomId)) {
        tile.image.sourceUrl = '';
      }
    }

    return redactedContent;
  }

  getCdnResources(content) {
    return content.tiles.filter(tile => tile.image?.sourceType === IMAGE_SOURCE_TYPE.internal && tile.image.sourceUrl).map(tile => tile.image.sourceUrl);
  }
}
