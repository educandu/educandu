const ImageEditor = require('./editing/image-editor.jsx');

class Image {
  static get typeName() { return 'image'; }

  getEditorComponent() {
    return ImageEditor;
  }
}

module.exports = Image;
