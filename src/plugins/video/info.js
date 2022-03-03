import React from 'react';
import VideoIcon from './video-icon.js';
import { SOURCE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';

export default class Video {
  static get typeName() { return 'video'; }

  constructor() {
    this.type = 'video';
  }

  getName(t) {
    return t('video:name');
  }

  getIcon() {
    return <VideoIcon />;
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
