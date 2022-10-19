import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import MultitrackMediaIcon from './multitrack-media-icon.js';
import MultitrackMediaDisplay from './multitrack-media-display.js';
import { isInternalSourceType } from '../../utils/source-utils.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { createDefaultContent, validateContent } from './multitrack-media-utils.js';

class MultitrackMediaInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'multitrack-media'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'multitrack-media';
  }

  getName(t) {
    return t('multitrackMedia:name');
  }

  getIcon() {
    return <MultitrackMediaIcon />;
  }

  getDisplayComponent() {
    return MultitrackMediaDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./multitrack-media-editor.js')).default;
  }

  getDefaultContent(t) {
    return createDefaultContent(t);
  }

  validateContent(content) {
    validateContent(content);
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.mainTrack.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.mainTrack.copyrightNotice,
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    if (!isAccessibleStoragePath(redactedContent.mainTrack.sourceUrl, targetRoomId)) {
      redactedContent.mainTrack.sourceUrl = '';
    }

    redactedContent.secondaryTracks.forEach(secondaryTrack => {
      secondaryTrack.copyrightNotice = this.gfm.redactCdnResources(
        secondaryTrack.copyrightNotice,
        url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
      );

      if (!isAccessibleStoragePath(secondaryTrack.sourceUrl, targetRoomId)) {
        secondaryTrack.sourceUrl = '';
      }
    });

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.mainTrack.copyrightNotice));

    if (isInternalSourceType({ url: content.mainTrack.sourceUrl })) {
      cdnResources.push(content.mainTrack.sourceUrl);
    }
    content.secondaryTracks.forEach(secondaryTrack => {
      cdnResources.push(...this.gfm.extractCdnResources(secondaryTrack.copyrightNotice));

      if (isInternalSourceType({ url: secondaryTrack.sourceUrl })) {
        cdnResources.push(secondaryTrack.sourceUrl);
      }
    });

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MultitrackMediaInfo;
