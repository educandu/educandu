import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { PLUGIN_GROUP } from '../../domain/constants.js';
import MultitrackMediaIcon from './combined-multitrack-media-icon.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import { createDefaultContent, validateContent } from './combined-multitrack-media-utils.js';

class CombinedMultitrackMediaInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'combined-multitrack-media';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('combinedMultitrackMedia:name');
  }

  getIcon() {
    return <MultitrackMediaIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.audioVideo];
  }

  async resolveDisplayComponent() {
    return (await import('./combined-multitrack-media-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./combined-multitrack-media-editor.js')).default;
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

    redactedContent.note = this.gfm.redactCdnResources(
      redactedContent.note,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    redactedContent.player1.track.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.player1.track.copyrightNotice,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    if (!couldAccessUrlFromRoom(redactedContent.player1.track.sourceUrl, targetRoomId)) {
      redactedContent.player1.track.sourceUrl = '';
    }

    if (!couldAccessUrlFromRoom(redactedContent.player1.posterImage.sourceUrl, targetRoomId)) {
      redactedContent.player1.posterImage.sourceUrl = '';
    }

    redactedContent.player2.tracks.forEach(track => {
      track.copyrightNotice = this.gfm.redactCdnResources(
        track.copyrightNotice,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );

      if (!couldAccessUrlFromRoom(track.sourceUrl, targetRoomId)) {
        track.sourceUrl = '';
      }
    });

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.note));
    cdnResources.push(...this.gfm.extractCdnResources(content.player1.track.copyrightNotice));

    if (isInternalSourceType({ url: content.player1.track.sourceUrl })) {
      cdnResources.push(content.player1.track.sourceUrl);
    }

    if (isInternalSourceType({ url: content.player1.posterImage.sourceUrl })) {
      cdnResources.push(content.player1.posterImage.sourceUrl);
    }

    content.player2.tracks.forEach(track => {
      cdnResources.push(...this.gfm.extractCdnResources(track.copyrightNotice));

      if (isInternalSourceType({ url: track.sourceUrl })) {
        cdnResources.push(track.sourceUrl);
      }
    });

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default CombinedMultitrackMediaInfo;
