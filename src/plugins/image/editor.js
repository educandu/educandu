const ImageEditor = require('./editing/image-editor');

class Image {
  static get typeName() { return 'image'; }

  getEditorComponent() {
    return ImageEditor;
  }
}

module.exports = Image;
