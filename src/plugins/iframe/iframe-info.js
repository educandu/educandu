import joi from 'joi';
import React from 'react';
import IframeIcon from './iframe-icon.js';
import cloneDeep from '../../utils/clone-deep.js';

class IframeInfo {
  static typeName = 'iframe';

  getDisplayName(t) {
    return t('iframe:name');
  }

  getIcon() {
    return <IframeIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./iframe-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./iframe-editor.js')).default;
  }

  getDefaultContent() {
    return {
      url: '',
      width: 100,
      height: 150,
      isBorderVisible: true
    };
  }

  validateContent(content) {
    const schema = joi.object({
      url: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required(),
      height: joi.number().min(0).required(),
      isBorderVisible: joi.boolean().required()
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

export default IframeInfo;
