import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import MediaAnalysisIcon from './media-analysis-icon.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import MediaAnalysisDisplay from './media-analysis-display.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { createDefaultContent, validateContent } from './media-analysis-utils.js';

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
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    if (redactedContent.mainTrack.sourceType === MEDIA_SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.mainTrack.sourceUrl, targetRoomId)) {
      redactedContent.mainTrack.sourceUrl = '';
    }

    redactedContent.secondaryTracks.forEach(secondaryTrack => {
      secondaryTrack.copyrightNotice = this.gfm.redactCdnResources(
        secondaryTrack.copyrightNotice,
        url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
      );

      if (secondaryTrack.sourceType === MEDIA_SOURCE_TYPE.internal && !isAccessibleStoragePath(secondaryTrack.sourceUrl, targetRoomId)) {
        secondaryTrack.sourceUrl = '';
      }
    });

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.mainTrack.copyrightNotice));

    if (content.mainTrack.sourceType === MEDIA_SOURCE_TYPE.internal && content.mainTrack.sourceUrl) {
      cdnResources.push(content.mainTrack.sourceUrl);
    }
    content.secondaryTracks.forEach(secondaryTrack => {
      cdnResources.push(...this.gfm.extractCdnResources(secondaryTrack.copyrightNotice));

      if (secondaryTrack.sourceType === MEDIA_SOURCE_TYPE.internal && secondaryTrack.sourceUrl) {
        cdnResources.push(secondaryTrack.sourceUrl);
      }
    });

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MediaAnalysisInfo;