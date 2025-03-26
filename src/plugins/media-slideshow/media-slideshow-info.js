import joi from 'joi';
import React from 'react';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import { PLUGIN_GROUP } from '../../domain/constants.js';
import { CHAPTER_TYPE, IMAGE_FIT } from './constants.js';
import MediaSlideshowIcon from './media-slideshow-icon.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

class MediaSlideshowInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'media-slideshow';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('mediaSlideshow:name');
  }

  getIcon() {
    return <MediaSlideshowIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.audioVideo];
  }

  async resolveDisplayComponent() {
    return (await import('./media-slideshow-display.js')).default;
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
      initialVolume: 1,
      chapters: [this.getDefaultChapter()]
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required(),
      width: joi.number().min(0).max(100).required(),
      initialVolume: joi.number().min(0).max(1).required(),
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
      })).unique('key').required()
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
      chapter.text = this.gfm.redactCdnResources(
        chapter.text,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );

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
      cdnResources.push(...this.gfm.extractCdnResources(chapter.text));
      cdnResources.push(...this.gfm.extractCdnResources(chapter.image.copyrightNotice));

      if (isInternalSourceType({ url: chapter.image.sourceUrl })) {
        cdnResources.push(chapter.image.sourceUrl);
      }
    });

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MediaSlideshowInfo;
