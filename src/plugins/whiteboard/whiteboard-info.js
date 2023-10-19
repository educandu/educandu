import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import WhiteboardIcon from './whiteboard-icon.js';

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
      width: 100
    };
  }

  validateContent(content) {
    const schema = joi.object({
      width: joi.number().integer().min(0).max(100).required()
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
