import React from 'react';
import VideoIcon from './video-icon.js';
import { SOURCE_TYPE } from './constants.js';
import VideoDisplay from './video-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { isAccessibleStoragePath } from '../../ui/path-helper.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class VideoInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'video'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'video';
  }

  getName(t) {
    return t('video:name');
  }

  getIcon() {
    return <VideoIcon />;
  }

  getDisplayComponent() {
    return VideoDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./video-editor.js')).default;
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

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.text = this.gfm.redactCdnResources(
      redactedContent.text,
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    if (redactedContent.sourceType === SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    if (redactedContent.posterImage.sourceType === SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.posterImage.sourceUrl, targetRoomId)) {
      redactedContent.posterImage.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.text || ''));

    if (content.sourceType === SOURCE_TYPE.internal && content.sourceUrl) {
      cdnResources.push(content.sourceUrl);
    }

    if (content.posterImage.sourceType === SOURCE_TYPE.internal && content.posterImage.sourceUrl) {
      cdnResources.push(content.posterImage.sourceUrl);
    }

    return cdnResources;
  }
}

export default VideoInfo;
