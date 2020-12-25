const ImageTilesEditor = require('./editing/image-tiles-editor');

class ImageTiles {
  static get typeName() { return 'image-tiles'; }

  getEditorComponent() {
    return ImageTilesEditor;
  }
}

module.exports = ImageTiles;
