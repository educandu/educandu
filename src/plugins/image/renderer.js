import ImageDisplay from './display/image-display';

class Image {
  static get typeName() { return 'image'; }

  getDisplayComponent() {
    return ImageDisplay;
  }
}

export default Image;
