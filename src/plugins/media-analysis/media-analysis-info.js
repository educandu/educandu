import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import MediaAnalysisIcon from './media-analysis-icon.js';
import MediaAnalysisDisplay from './media-analysis-display.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { createDefaultContent, validateContent } from './media-analysis-utils.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

class MediaAnalysisInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'media-analysis'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'media-analysis';
  }

  getName(t) {
    return t('mediaAnalysis:name');
  }

  getIcon() {
    return <MediaAnalysisIcon />;
  }

  getDisplayComponent() {
    return MediaAnalysisDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./media-analysis-editor.js')).default;
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
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    if (!couldAccessUrlFromRoom(redactedContent.mainTrack.sourceUrl, targetRoomId)) {
      redactedContent.mainTrack.sourceUrl = '';
    }

    redactedContent.secondaryTracks.forEach(secondaryTrack => {
      secondaryTrack.copyrightNotice = this.gfm.redactCdnResources(
        secondaryTrack.copyrightNotice,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );

      if (!couldAccessUrlFromRoom(secondaryTrack.sourceUrl, targetRoomId)) {
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

export default MediaAnalysisInfo;
