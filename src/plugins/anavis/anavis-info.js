import React from 'react';
import AnavisIcon from './anavis-icon.js';
import { MEDIA_KIND } from './constants.js';
import AnavisDisplay from './anavis-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

class AnavisInfo {
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

  getDisplayComponent() {
    return AnavisDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./anavis-editor.js')).default;
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
        sourceType: MEDIA_SOURCE_TYPE.youtube,
        sourceUrl: '',
        copyrightNotice: '',
        aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine
      }
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    if (redactedContent.media) {
      redactedContent.media.copyrightNotice = this.gfm.redactCdnResources(
        redactedContent.media.copyrightNotice,
        url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
      );
    }

    if (redactedContent.media?.sourceType === MEDIA_SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.media.sourceUrl, targetRoomId)) {
      redactedContent.media.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.media?.copyrightNotice));

    if (content.media?.sourceType === MEDIA_SOURCE_TYPE.internal && content.media.sourceUrl) {
      cdnResources.push(content.media.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default AnavisInfo;
