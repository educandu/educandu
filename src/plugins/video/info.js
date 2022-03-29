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
      sourceType: SOURCE_TYPE.internal,
      sourceUrl: '',
      text: '',
      width: 100,
      aspectRatio: {
        h: 16,
        v: 9
      },
      showVideo: true,
      posterImage: {
        sourceType: SOURCE_TYPE.internal,
        sourceUrl: ''
      }
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources(content) {
    const sourceUrl = content.sourceType === SOURCE_TYPE.internal && content.sourceUrl;
    const posterImageSourceUrl = content.posterImage.sourceType === SOURCE_TYPE.internal && content.posterImage.sourceUrl;
    return [sourceUrl, posterImageSourceUrl].filter(url => url);
  }
}
