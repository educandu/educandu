import ImageEditor from './editing/image-editor.js';

class Image {
  static get typeName() { return 'image'; }

  getEditorComponent() {
    return ImageEditor;
  }
}

export default Image;
