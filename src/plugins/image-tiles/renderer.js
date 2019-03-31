const ImageTilesDisplay = require('./display/image-tiles-display.jsx');

class ImageTiles {
  static get typeName() { return 'image-tiles'; }

  getDisplayComponent() {
    return ImageTilesDisplay;
  }
}

module.exports = ImageTiles;
