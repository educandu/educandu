import React from 'react';
import { SOURCE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import { VideoCameraOutlined } from '@ant-design/icons';

export default class Video {
  static get typeName() { return 'video'; }

  constructor() {
    this.type = 'video';
  }

  getName(t) {
    return t('video:name');
  }

  getIcon() {
    return <VideoCameraOutlined />;
  }

  getDefaultContent() {
    return {
      type: SOURCE_TYPE.internal,
      url: '',
      text: '',
      width: 100,
      aspectRatio: {
        h: 16,
        v: 9
      },
      showVideo: true
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources(content) {
    return content.type === SOURCE_TYPE.internal && content.url ? [content.url] : [];
  }
}
