import React from 'react';
import { IMAGE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import ImageTilesIcon from './image-tiles-icon.js';
import ImageTilesDisplay from './image-tiles-display.js';
import { isAccessibleStoragePath } from '../../ui/path-helper.js';

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

  getDisplayComponentType() {
    return ImageTilesDisplay;
  }

  async resolveEditorComponentType() {
    return (await import('./image-tiles-editor.js')).default;
  }

  getDefaultContent() {
    return {
      tiles: [],
      maxTilesPerRow: 3,
      maxWidth: 100,
      hoverEffect: 'none'
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    for (const tile of redactedContent.tiles) {
      if (tile.image?.type === IMAGE_TYPE.internal && !isAccessibleStoragePath(tile.image.url, targetRoomId)) {
        tile.image.url = '';
      }
    }

    return redactedContent;
  }

  getCdnResources(content) {
    return content.tiles.filter(tile => tile.image?.type === IMAGE_TYPE.internal && tile.image.url).map(tile => tile.image.url);
  }
}
