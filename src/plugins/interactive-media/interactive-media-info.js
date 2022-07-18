import React from 'react';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import InteractiveMediaIcon from './interactive-media-icon.js';
import InteractiveMediaDisplay from './interactive-media-display.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { MEDIA_ASPECT_RATIO, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

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

  getDefaultChapter(t) {
    return {
      key: uniqueId.create(),
      startTimecode: 0,
      title: `[${t('interactiveMedia:chapter')}]`,
      question: `[${t('common:question')}]`,
      answers: [],
      correctAnswerIndex: -1
    };
  }

  getDefaultContent(t) {
    return {
      sourceType: MEDIA_SOURCE_TYPE.internal,
      sourceUrl: '',
      sourceDuration: 0,
      startTimecode: null,
      stopTimecode: null,
      copyrightNotice: '',
      width: 100,
      aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
      showVideo: false,
      chapters: [this.getDefaultChapter(t)]
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.copyrightNotice,
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    if (redactedContent.sourceType === MEDIA_SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.copyrightNotice));

    if (content.sourceType === MEDIA_SOURCE_TYPE.internal && content.sourceUrl) {
      cdnResources.push(content.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default InteractiveMediaInfo;
