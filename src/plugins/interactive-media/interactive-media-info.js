import React from 'react';
import { SOURCE_TYPE } from './constants.js';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import InteractiveMediaIcon from './interactive-media-icon.js';
import { isAccessibleStoragePath } from '../../ui/path-helper.js';
import InteractiveMediaDisplay from './interactive-media-display.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class InteractiveMediaInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'interactive-media'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'interactive-media';
  }

  getName(t) {
    return t('interactiveMedia:name');
  }

  getIcon() {
    return <InteractiveMediaIcon />;
  }

  getDisplayComponent() {
    return InteractiveMediaDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./interactive-media-editor.js')).default;
  }

  getDefaultContent(t) {
    return {
      sourceType: SOURCE_TYPE.internal,
      sourceUrl: '',
      sourceDuration: 0,
      text: '',
      width: 100,
      aspectRatio: {
        h: 16,
        v: 9
      },
      showVideo: false,
      chapters: [
        {
          startTimecode: 0,
          key: uniqueId.create(),
          title: t('interactiveMedia:defaultChapterTitle')
        }
      ]
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

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.text || ''));

    if (content.sourceType === SOURCE_TYPE.internal && content.sourceUrl) {
      cdnResources.push(content.sourceUrl);
    }

    return cdnResources;
  }
}

export default InteractiveMediaInfo;
