const ImageDisplay = require('./display/image-display.jsx');

class Image {
  static get typeName() { return 'image'; }

  getDisplayComponent() {
    return ImageDisplay;
  }
}

module.exports = Image;
