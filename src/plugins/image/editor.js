import ImageEditor from './editing/image-editor';

class Image {
  static get typeName() { return 'image'; }

  getEditorComponent() {
    return ImageEditor;
  }
}

export default Image;
