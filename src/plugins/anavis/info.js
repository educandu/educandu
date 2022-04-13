import React from 'react';
import AnavisIcon from './anavis-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import { MEDIA_KIND, MEDIA_TYPE } from './constants.js';
import { isAccessibleStoragePath } from '../../ui/path-helper.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

export default class Anavis {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'anavis'; }

  constructor(gfm) {
    this.gfm = gfm;
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

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    if (redactedContent.media) {
      redactedContent.media.text = this.gfm.redactCdnResources(
        redactedContent.media.text,
        url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
      );
    }

    if (redactedContent.media?.type === MEDIA_TYPE.internal && !isAccessibleStoragePath(redactedContent.media.url, targetRoomId)) {
      redactedContent.media.url = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.media?.text));

    if (content.media?.type === MEDIA_TYPE.internal && content.media.url) {
      cdnResources.push(content.media.url);
    }

    return cdnResources;
  }
}
