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

  getDisplayComponentType() {
    return IframeDisplay;
  }

  async resolveEditorComponentType() {
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
