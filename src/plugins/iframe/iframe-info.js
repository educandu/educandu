import joi from 'joi';
import React from 'react';
import IframeIcon from './iframe-icon.js';
import IframeDisplay from './iframe-display.js';
import cloneDeep from '../../utils/clone-deep.js';

class IframeInfo {
  static get typeName() { return 'iframe'; }

  constructor() {
    this.type = 'iframe';
  }

  getName(t) {
    return t('iframe:name');
  }

  getIcon() {
    return <IframeIcon />;
  }

  getDisplayComponent() {
    return IframeDisplay;
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
