import React from 'react';
import AnavisIcon from './anavis-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import { MEDIA_KIND, MEDIA_TYPE } from './constants.js';

export default class Anavis {
  static get typeName() { return 'anavis'; }

  constructor() {
    this.type = 'anavis';
  }

  getName(t) {
    return t('anavis:name');
  }

  getIcon() {
    return <AnavisIcon />;
  }

  getDefaultContent(t) {
    return {
      width: 100,
      parts: [
        {
          color: '#4582b4',
          name: t('anavis:defaultPartName'),
          length: 1000,
          annotations: []
        }
      ],
      media: {
        kind: MEDIA_KIND.video,
        type: MEDIA_TYPE.youtube,
        url: '',
        text: '',
        aspectRatio: {
          h: 16,
          v: 9
        }
      }
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources(content) {
    return content.media?.type === MEDIA_TYPE.internal && content.media.url ? [content.media.url] : [];
  }
}
