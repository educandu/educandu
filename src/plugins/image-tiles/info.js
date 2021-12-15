import { IMAGE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';

export default class ImageTiles {
  static get typeName() { return 'image-tiles'; }

  constructor() {
    this.type = 'image-tiles';
  }

  getName(t) {
    return t('imageTiles:name');
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

  getCdnResources(content) {
    return content.tiles.filter(tile => tile.image?.type === IMAGE_TYPE.internal && tile.image.url).map(tile => tile.image.url);
  }
}
