import IframeDisplay from './display/iframe-display';

class Iframe {
  static get typeName() { return 'iframe'; }

  getDisplayComponent() {
    return IframeDisplay;
  }
}

export default Iframe;
