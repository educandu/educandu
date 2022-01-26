import React from 'react';
import { SOURCE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import { SoundOutlined } from '@ant-design/icons';

export default class Audio {
  static get typeName() { return 'audio'; }

  constructor() {
    this.type = 'audio';
  }

  getName(t) {
    return t('audio:name');
  }

  getIcon() {
    return <SoundOutlined />;
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
