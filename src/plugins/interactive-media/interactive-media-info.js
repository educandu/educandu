import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import InteractiveMediaIcon from './interactive-media-icon.js';
import InteractiveMediaDisplay from './interactive-media-display.js';

class InteractiveMediaInfo {
  static get typeName() { return 'interactive-media'; }

  constructor() {
    this.type = 'interactive-media';
  }

  getName(t) {
    return t('interactiveMedia:name');
  }

  getIcon() {
    return <InteractiveMediaIcon />;
  }

  getDisplayComponent() {
    return InteractiveMediaDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./interactive-media-editor.js')).default;
  }

  getDefaultContent() {
    return {};
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

export default InteractiveMediaInfo;
