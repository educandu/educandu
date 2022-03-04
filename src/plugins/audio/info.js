import React from 'react';
import AudioIcon from './audio-icon.js';
import { SOURCE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';

export default class Audio {
  static get typeName() { return 'audio'; }

  constructor() {
    this.type = 'audio';
  }

  getName(t) {
    return t('audio:name');
  }

  getIcon() {
    return <AudioIcon />;
  }

  getDefaultContent() {
    return {
      type: SOURCE_TYPE.internal,
      url: '',
      text: ''
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources(content) {
    return content.type === SOURCE_TYPE.internal && content.url ? [content.url] : [];
  }
}
