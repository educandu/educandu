import ImageTilesEditor from './editing/image-tiles-editor';

class ImageTiles {
  static get typeName() { return 'image-tiles'; }

  getEditorComponent() {
    return ImageTilesEditor;
  }
}

export default ImageTiles;
