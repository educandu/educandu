import PdfViewerEditor from './editing/pdf-viewer-editor.js';

class PdfViewer {
  static get typeName() { return 'pdf-viewer'; }

  getEditorComponent() {
    return PdfViewerEditor;
  }
}

export default PdfViewer;
