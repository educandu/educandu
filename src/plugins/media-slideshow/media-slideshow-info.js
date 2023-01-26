import joi from 'joi';
import React from 'react';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import { CHAPTER_TYPE, IMAGE_FIT } from './constants.js';
import MediaSlideshowIcon from './media-slideshow-icon.js';
import MediaSlideshowDisplay from './media-slideshow-display.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

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

  getDefaultChapterImage() {
    return {
      sourceUrl: '',
      fit: IMAGE_FIT.cover,
      copyrightNotice: ''
    };
  }

  getDefaultChapter() {
    return {
      key: uniqueId.create(),
      startPosition: 0,
      type: CHAPTER_TYPE.image,
      image: this.getDefaultChapterImage(),
      text: ''
    };
  }

  getDefaultContent() {
    return {
      sourceUrl: '',
      copyrightNotice: '',
      playbackRange: [0, 1],
      width: 100,
      chapters: [this.getDefaultChapter()]
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required(),
      width: joi.number().min(0).max(100).required(),
      chapters: joi.array().items(joi.object({
        key: joi.string().required(),
        startPosition: joi.number().min(0).max(1).required(),
        type: joi.string().valid(...Object.values(CHAPTER_TYPE)).required(),
        image: joi.object({
          sourceUrl: joi.string().allow('').required(),
          fit: joi.string().valid(...Object.values(IMAGE_FIT)).required(),
          copyrightNotice: joi.string().allow('').required()
        }).required(),
        text: joi.string().allow('').required()
      })).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.copyrightNotice,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    if (!couldAccessUrlFromRoom(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    redactedContent.chapters.forEach(chapter => {
      chapter.image.copyrightNotice = this.gfm.redactCdnResources(
        chapter.image.copyrightNotice,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );

      if (!couldAccessUrlFromRoom(chapter.image.sourceUrl, targetRoomId)) {
        chapter.image.sourceUrl = '';
      }
    });

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.copyrightNotice));

    if (isInternalSourceType({ url: content.sourceUrl })) {
      cdnResources.push(content.sourceUrl);
    }

    content.chapters.forEach(chapter => {
      if (isInternalSourceType({ url: chapter.image.sourceUrl })) {
        cdnResources.push(chapter.image.sourceUrl);
      }

      cdnResources.push(...this.gfm.extractCdnResources(chapter.image.copyrightNotice));
    });

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MediaSlideshowInfo;
