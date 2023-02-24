import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import DiagramNetIcon from './diagram-net-icon.js';

class DiagramNetInfo {
  static typeName = 'diagram-net';

  getDisplayName(t) {
    return t('diagramNet:name');
  }

  getIcon() {
    return <DiagramNetIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./diagram-net-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./diagram-net-editor.js')).default;
  }

  getDefaultContent() {
    return {
      xml: null,
      image: null,
      width: 100
    };
  }

  validateContent(content) {
    const schema = joi.object({
      xml: joi.string().allow(null).required(),
      image: joi.string().allow(null).required(),
      width: joi.number().min(0).max(100).required()
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

export default DiagramNetInfo;
