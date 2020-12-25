const IframeDisplay = require('./display/iframe-display');

class Iframe {
  static get typeName() { return 'iframe'; }

  getDisplayComponent() {
    return IframeDisplay;
  }
}

module.exports = Iframe;
