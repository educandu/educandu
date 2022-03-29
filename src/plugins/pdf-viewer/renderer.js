import PdfViewerDisplay from './display/pdf-viewer-display.js';

class PdfViewer {
  static get typeName() { return 'pdf-viewer'; }

  getDisplayComponent() {
    return PdfViewerDisplay;
  }
}

export default PdfViewer;
