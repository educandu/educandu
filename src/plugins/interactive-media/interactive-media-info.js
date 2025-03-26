import joi from 'joi';
import React from 'react';
import uniqueId from '../../utils/unique-id.js';
import cloneDeep from '../../utils/clone-deep.js';
import InteractiveMediaIcon from './interactive-media-icon.js';
import { MEDIA_ASPECT_RATIO, PLUGIN_GROUP } from '../../domain/constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';

class InteractiveMediaInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'interactive-media';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('interactiveMedia:name');
  }

  getIcon() {
    return <InteractiveMediaIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.audioVideo, PLUGIN_GROUP.interactive];
  }

  async resolveDisplayComponent() {
    return (await import('./interactive-media-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./interactive-media-editor.js')).default;
  }

  getDefaultChapter() {
    return {
      key: uniqueId.create(),
      startPosition: 0,
      title: '',
      text: '',
      answers: [],
      correctAnswerIndex: -1
    };
  }

  getDefaultContent() {
    return {
      sourceUrl: '',
      copyrightNotice: '',
      playbackRange: [0, 1],
      aspectRatio: MEDIA_ASPECT_RATIO.sixteenToNine,
      showVideo: false,
      width: 100,
      initialVolume: 1,
      chapters: [this.getDefaultChapter()],
      posterImage: {
        sourceUrl: ''
      }
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      playbackRange: joi.array().items(joi.number().min(0).max(1)).required(),
      aspectRatio: joi.string().valid(...Object.values(MEDIA_ASPECT_RATIO)).required(),
      showVideo: joi.boolean().required(),
      width: joi.number().min(0).max(100).required(),
      initialVolume: joi.number().min(0).max(1).required(),
      chapters: joi.array().items(joi.object({
        key: joi.string().required(),
        startPosition: joi.number().min(0).max(1).required(),
        title: joi.string().allow('').required(),
        text: joi.string().allow('').required(),
        answers: joi.array().items(joi.string().allow('')).required(),
        correctAnswerIndex: joi.number().min(-1).required()
      })).unique('key').required(),
      posterImage: joi.object({
        sourceUrl: joi.string().allow('').required()
      }).required()
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

    if (!couldAccessUrlFromRoom(redactedContent.posterImage.sourceUrl, targetRoomId)) {
      redactedContent.posterImage.sourceUrl = '';
    }

    for (const chapter of redactedContent.chapters) {
      chapter.text = this.gfm.redactCdnResources(
        chapter.text,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );

      chapter.answers = chapter.answers.map(answer => {
        return this.gfm.redactCdnResources(
          answer,
          url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
        );
      });
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.copyrightNotice));

    if (isInternalSourceType({ url: content.sourceUrl })) {
      cdnResources.push(content.sourceUrl);
    }

    if (isInternalSourceType({ url: content.posterImage.sourceUrl })) {
      cdnResources.push(content.posterImage.sourceUrl);
    }

    for (const chapter of content.chapters) {
      cdnResources.push(...this.gfm.extractCdnResources(chapter.text));

      for (const answer of chapter.answers) {
        cdnResources.push(...this.gfm.extractCdnResources(answer));
      }
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default InteractiveMediaInfo;
