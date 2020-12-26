import IframeEditor from './editing/iframe-editor';

class Iframe {
  static get typeName() { return 'iframe'; }

  getEditorComponent() {
    return IframeEditor;
  }
}

export default Iframe;
