import ImageTilesDisplay from './display/image-tiles-display';

class ImageTiles {
  static get typeName() { return 'image-tiles'; }

  getDisplayComponent() {
    return ImageTilesDisplay;
  }
}

export default ImageTiles;
