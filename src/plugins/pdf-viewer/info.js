import React from 'react';
import { RENDER_MODE, SOURCE_TYPE } from './constants.js';
import PdfViewerIcon from './pdf-viewer-icon.js';
import cloneDeep from '../../utils/clone-deep.js';

export default class PdfViewer {
  static get typeName() { return 'pdf-viewer'; }

  constructor() {
    this.type = 'pdf-viewer';
  }

  getName(t) {
    return t('pdfViewer:name');
  }

  getIcon() {
    return <PdfViewerIcon />;
  }

  getDefaultContent() {
    return {
      sourceType: SOURCE_TYPE.internal,
      sourceUrl: '',
      renderMode: RENDER_MODE.svg,
      showTextOverlay: true,
      width: 100,
      caption: ''
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources(content) {
    return content.type === SOURCE_TYPE.internal && content.url ? [content.url] : [];
  }
}
