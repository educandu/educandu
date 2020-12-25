const IframeEditor = require('./editing/iframe-editor');

class Iframe {
  static get typeName() { return 'iframe'; }

  getEditorComponent() {
    return IframeEditor;
  }
}

module.exports = Iframe;
