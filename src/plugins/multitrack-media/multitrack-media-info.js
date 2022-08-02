import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import MultitrackMediaIcon from './multitrack-media-icon.js';
import MultitrackMediaDisplay from './multitrack-media-display.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

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

  getDefaultMainTrack(t) {
    return {
      name: `[${t('multitrackMedia:mainTrack')}]`,
      sourceType: MEDIA_SOURCE_TYPE.internal,
      sourceUrl: '',
      aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
      showVideo: false,
      copyrightNotice: '',
      playbackRange: [0, 1],
      volume: 1
    };
  }

  getDefaultSecondaryTrack(t, index) {
    return {
      name: `[${t('multitrackMedia:secondaryTrack', { number: index + 1 })}]`,
      sourceType: MEDIA_SOURCE_TYPE.internal,
      sourceUrl: '',
      copyrightNotice: '',
      offsetTimecode: 0,
      volume: 1
    };
  }

  getDefaultContent(t) {
    return {
      width: 100,
      mainTrack: this.getDefaultMainTrack(t),
      secondaryTracks: [this.getDefaultSecondaryTrack(t, 0)]
    };
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

export default MultitrackMediaInfo;
