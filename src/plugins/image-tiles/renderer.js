import ImageTilesDisplay from './display/image-tiles-display.js';

class ImageTiles {
  static get typeName() { return 'image-tiles'; }

  getDisplayComponent() {
    return ImageTilesDisplay;
  }
}

export default ImageTiles;
