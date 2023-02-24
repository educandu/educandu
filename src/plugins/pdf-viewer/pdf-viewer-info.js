import joi from 'joi';
import React from 'react';
import PdfViewerIcon from './pdf-viewer-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

class PdfViewerInfo {
  static typeName = 'pdf-viewer';

  getDisplayName(t) {
    return t('pdfViewer:name');
  }

  getIcon() {
    return <PdfViewerIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./pdf-viewer-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./pdf-viewer-editor.js')).default;
  }

  getDefaultContent() {
    return {
      sourceUrl: '',
      initialPageNumber: 1,
      showTextOverlay: true,
      width: 100,
      caption: ''
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceUrl: joi.string().allow('').required(),
      initialPageNumber: joi.number().min(1).required(),
      showTextOverlay: joi.boolean().required(),
      width: joi.number().min(0).max(100).required(),
      caption: joi.string().allow('').required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    if (!couldAccessUrlFromRoom(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    return isInternalSourceType({ url: content.sourceUrl }) ? [content.sourceUrl] : [];
  }
}

export default PdfViewerInfo;
