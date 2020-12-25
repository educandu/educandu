const ImageTilesDisplay = require('./display/image-tiles-display');

class ImageTiles {
  static get typeName() { return 'image-tiles'; }

  getDisplayComponent() {
    return ImageTilesDisplay;
  }
}

module.exports = ImageTiles;
