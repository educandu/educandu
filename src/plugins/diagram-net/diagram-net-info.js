import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import DiagramNetIcon from './diagram-net-icon.js';
import DiagramNetDisplay from './diagram-net-display.js';

class DiagramNetInfo {
  static get typeName() { return 'diagram-net'; }

  constructor() {
    this.type = 'diagram-net';
  }

  getName(t) {
    return t('diagramNet:name');
  }

  getIcon() {
    return <DiagramNetIcon />;
  }

  getDisplayComponent() {
    return DiagramNetDisplay;
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

    joi.attempt(content, schema, { convert: false, noDefaults: true });
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
