import joi from 'joi';
import React from 'react';
import { SOURCE_TYPE } from './constants.js';
import PdfViewerIcon from './pdf-viewer-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import PdfViewerDisplay from './pdf-viewer-display.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';

class PdfViewerInfo {
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

  getDisplayComponent() {
    return PdfViewerDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./pdf-viewer-editor.js')).default;
  }

  getDefaultContent() {
    return {
      sourceType: SOURCE_TYPE.internal,
      sourceUrl: '',
      initialPageNumber: 1,
      showTextOverlay: true,
      width: 100,
      caption: ''
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceType: joi.string().valid(...Object.values(SOURCE_TYPE)).required(),
      sourceUrl: joi.string().allow('').required(),
      initialPageNumber: joi.number().min(1).required(),
      showTextOverlay: joi.boolean().required(),
      width: joi.number().min(0).max(100).required(),
      caption: joi.string().allow('').required()
    });

    joi.attempt(content, schema, { convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    if (redactedContent.sourceType === SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    return content.sourceType === SOURCE_TYPE.internal && content.sourceUrl ? [content.sourceUrl] : [];
  }
}

export default PdfViewerInfo;
