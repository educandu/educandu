import ImageDisplay from './display/image-display.js';

class Image {
  static get typeName() { return 'image'; }

  getDisplayComponent() {
    return ImageDisplay;
  }
}

export default Image;
