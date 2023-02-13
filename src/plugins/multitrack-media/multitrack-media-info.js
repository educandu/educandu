import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import MultitrackMediaIcon from './multitrack-media-icon.js';
import MultitrackMediaDisplay from './multitrack-media-display.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { createDefaultContent, validateContent } from './multitrack-media-utils.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

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

    redactedContent.tracks.forEach(track => {
      track.copyrightNotice = this.gfm.redactCdnResources(
        track.copyrightNotice,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );

      if (!couldAccessUrlFromRoom(track.sourceUrl, targetRoomId)) {
        track.sourceUrl = '';
      }
    });

    if (!couldAccessUrlFromRoom(redactedContent.posterImage.sourceUrl, targetRoomId)) {
      redactedContent.posterImage.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    content.tracks.forEach(track => {
      cdnResources.push(...this.gfm.extractCdnResources(track.copyrightNotice));

      if (isInternalSourceType({ url: track.sourceUrl })) {
        cdnResources.push(track.sourceUrl);
      }
    });

    if (isInternalSourceType({ url: content.posterImage.sourceUrl })) {
      cdnResources.push(content.posterImage.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MultitrackMediaInfo;
