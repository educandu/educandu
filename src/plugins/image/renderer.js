const ImageDisplay = require('./display/image-display');

class Image {
  static get typeName() { return 'image'; }

  getDisplayComponent() {
    return ImageDisplay;
  }
}

module.exports = Image;
