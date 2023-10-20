import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import WhiteboardIcon from './whiteboard-icon.js';
import { MEDIA_ASPECT_RATIO } from '../../domain/constants.js';

class WhiteboardInfo {
  static typeName = 'whiteboard';

  allowsInput = true;

  getDisplayName(t) {
    return t('whiteboard:name');
  }

  getIcon() {
    return <WhiteboardIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./whiteboard-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./whiteboard-editor.js')).default;
  }

  getDefaultContent() {
    return {
      width: 100,
      viewportWidth: 1000,
      aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
      image: {
        sourceUrl: '',
        copyrightNotice: ''
      }
    };
  }

  validateContent(content) {
    const schema = joi.object({
      width: joi.number().integer().min(0).max(100).required(),
      viewportWidth: joi.number().min(0).max(1000).required(),
      aspectRatio: joi.string().valid(...Object.values(MEDIA_ASPECT_RATIO)).required(),
      image: joi.object({
        sourceUrl: joi.string().allow('').required(),
        copyrightNotice: joi.string().allow('').required()
      }).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content) {
    return cloneDeep(content);
  }

  getCdnResources() {
    return [];
  }
}

export default WhiteboardInfo;
