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

  getDisplayComponentType() {
    return DiagramNetDisplay;
  }

  async resolveEditorComponentType() {
    return (await import('./diagram-net-editor.js')).default;
  }

  getDefaultContent() {
    return {
      xml: null,
      image: null,
      maxWidth: 100
    };
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
