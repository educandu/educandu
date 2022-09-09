import joi from 'joi';
import React from 'react';
import AudioIcon from './audio-icon.js';
import AudioDisplay from './audio-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { MEDIA_SOURCE_TYPE } from '../../domain/constants.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class AudioInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'audio'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'audio';
  }

  getName(t) {
    return t('audio:name');
  }

  getIcon() {
    return <AudioIcon />;
  }

  getDisplayComponent() {
    return AudioDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./audio-editor.js')).default;
  }

  getDefaultContent() {
    return {
      sourceType: MEDIA_SOURCE_TYPE.internal,
      sourceUrl: '',
      copyrightNotice: ''
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceType: joi.string().valid(...Object.values(MEDIA_SOURCE_TYPE)).required(),
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required()
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

export default AudioInfo;
