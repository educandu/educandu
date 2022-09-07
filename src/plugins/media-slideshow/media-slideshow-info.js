import React from 'react';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import MediaSlideshowIcon from './media-slideshow-icon.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import MediaSlideshowDisplay from './media-slideshow-display.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class MediaSlideshowInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'media-slideshow'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'media-slideshow';
  }

  getName(t) {
    return t('mediaSlideshow:name');
  }

  getIcon() {
    return <MediaSlideshowIcon />;
  }

  getDisplayComponent() {
    return MediaSlideshowDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./media-slideshow-editor.js')).default;
  }

  getDefaultChapter() {
    return {
      key: uniqueId.create(),
      startPosition: 0,
      image: {
        sourceType: MEDIA_SOURCE_TYPE.internal,
        sourceUrl: '',
        copyrightNotice: ''
      }
    };
  }

  getDefaultContent(t) {
    return {
      sourceType: MEDIA_SOURCE_TYPE.internal,
      sourceUrl: '',
      playbackRange: [0, 1],
      copyrightNotice: '',
      width: 100,
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

    redactedContent.chapters.forEach(chapter => {
      chapter.image.copyrightNotice = this.gfm.redactCdnResources(
        chapter.image.copyrightNotice,
        url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
      );

      if (chapter.image.sourceType === MEDIA_SOURCE_TYPE.internal && !isAccessibleStoragePath(chapter.image.sourceUrl, targetRoomId)) {
        chapter.image.sourceUrl = '';
      }
    });

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.copyrightNotice));

    if (content.sourceType === MEDIA_SOURCE_TYPE.internal && content.sourceUrl) {
      cdnResources.push(content.sourceUrl);
    }

    content.chapters.forEach(chapter => {
      if (chapter.image?.sourceType === MEDIA_SOURCE_TYPE.internal && chapter.image?.sourceUrl) {
        cdnResources.push(chapter.image.sourceUrl);
      }

      cdnResources.push(...this.gfm.extractCdnResources(chapter.image?.copyrightNotice));
    });

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MediaSlideshowInfo;
