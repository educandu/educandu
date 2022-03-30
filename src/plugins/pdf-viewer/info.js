import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { RENDER_MODE, SOURCE_TYPE } from './constants.js';
import FileIcon from '../../components/icons/general/file-icon.js';

export default class PdfViewer {
  static get typeName() { return 'pdf-viewer'; }

  constructor() {
    this.type = 'pdf-viewer';
  }

  getName(t) {
    return t('pdfViewer:name');
  }

  getIcon() {
    return <FileIcon />;
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
