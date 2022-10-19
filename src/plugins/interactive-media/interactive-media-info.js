import joi from 'joi';
import React from 'react';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import InteractiveMediaIcon from './interactive-media-icon.js';
import { MEDIA_ASPECT_RATIO } from '../../domain/constants.js';
import { isInternalSourceType } from '../../utils/source-utils.js';
import InteractiveMediaDisplay from './interactive-media-display.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
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

  getDefaultChapter(t) {
    return {
      key: uniqueId.create(),
      startPosition: 0,
      title: `[${t('common:chapter')}]`,
      text: `[${t('common:text')}]`,
      answers: [],
      correctAnswerIndex: -1
    };
  }

  getDefaultContent(t) {
    return {
      sourceUrl: '',
      copyrightNotice: '',
      playbackRange: [0, 1],
      width: 100,
      aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
      showVideo: false,
      chapters: [this.getDefaultChapter(t)]
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required(),
      width: joi.number().min(0).max(100).required(),
      aspectRatio: joi.string().valid(...Object.values(MEDIA_ASPECT_RATIO)).required(),
      showVideo: joi.boolean().required(),
      chapters: joi.array().items(joi.object({
        key: joi.string().required(),
        startPosition: joi.number().min(0).max(1).required(),
        title: joi.string().allow('').required(),
        text: joi.string().allow('').required(),
        answers: joi.array().items(joi.string().allow('')).required(),
        correctAnswerIndex: joi.number().min(-1).required()
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
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    if (!isAccessibleStoragePath(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.copyrightNotice));

    if (isInternalSourceType({ url: content.sourceUrl })) {
      cdnResources.push(content.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default InteractiveMediaInfo;
