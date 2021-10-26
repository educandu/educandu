import IframeDisplay from './display/iframe-display.js';

class Iframe {
  static get typeName() { return 'iframe'; }

  getDisplayComponent() {
    return IframeDisplay;
  }
}

export default Iframe;
