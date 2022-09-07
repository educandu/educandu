import joi from 'joi';
import React from 'react';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import MediaSlideshowIcon from './media-slideshow-icon.js';
import MediaSlideshowDisplay from './media-slideshow-display.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { IMAGE_SOURCE_TYPE, MEDIA_SOURCE_TYPE } from '../../domain/constants.js';

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
        sourceType: IMAGE_SOURCE_TYPE.internal,
        sourceUrl: '',
        copyrightNotice: ''
      }
    };
  }

  getDefaultContent(t) {
    return {
      sourceType: MEDIA_SOURCE_TYPE.internal,
      sourceUrl: '',
      copyrightNotice: '',
      playbackRange: [0, 1],
      width: 100,
      chapters: [this.getDefaultChapter(t)]
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceType: joi.string().valid(...Object.values(MEDIA_SOURCE_TYPE)).required(),
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required(),
      width: joi.number().min(0).max(100).required(),
      chapters: joi.array().items(joi.object({
        key: joi.string().required(),
        startPosition: joi.number().min(0).max(1).required(),
        image: joi.object({
          sourceType: joi.string().valid(...Object.values(IMAGE_SOURCE_TYPE)).required(),
          sourceUrl: joi.string().allow('').required(),
          copyrightNotice: joi.string().allow('').required()
        }).required()
      })).required()
    });

    joi.attempt(content, schema, { convert: false, noDefaults: true });
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
      if (chapter.image.sourceType === MEDIA_SOURCE_TYPE.internal && chapter.image.sourceUrl) {
        cdnResources.push(chapter.image.sourceUrl);
      }

      cdnResources.push(...this.gfm.extractCdnResources(chapter.image.copyrightNotice));
    });

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MediaSlideshowInfo;
