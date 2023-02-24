import joi from 'joi';
import React from 'react';
import { IMAGE_POSITION } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import MarkdownWithImageIcon from './markdown-with-image-icon.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { couldAccessUrlFromRoom, isInternalSourceType } from '../../utils/source-utils.js';

class MarkdownWithImageInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'markdown-with-image';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('markdownWithImage:name');
  }

  getIcon() {
    return <MarkdownWithImageIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./markdown-with-image-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./markdown-with-image-editor.js')).default;
  }

  getDefaultContent() {
    return {
      text: '',
      textOffsetInEm: 0,
      width: 100,
      image: {
        sourceUrl: '',
        width: 50,
        position: IMAGE_POSITION.left,
        copyrightNotice: ''
      }
    };
  }

  validateContent(content) {
    const schema = joi.object({
      text: joi.string().allow('').required(),
      textOffsetInEm: joi.number().min(0).max(2).required(),
      width: joi.number().min(0).max(100).required(),
      image: joi.object({
        sourceUrl: joi.string().allow('').required(),
        width: joi.number().min(0).max(100).required(),
        position: joi.string().valid(...Object.values(IMAGE_POSITION)).required(),
        copyrightNotice: joi.string().allow('').required()
      }).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.text = this.gfm.redactCdnResources(
      redactedContent.text,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    redactedContent.image.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.image.copyrightNotice,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    if (!couldAccessUrlFromRoom(redactedContent.image.sourceUrl, targetRoomId)) {
      redactedContent.image.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.text));
    cdnResources.push(...this.gfm.extractCdnResources(content.image.copyrightNotice));

    if (isInternalSourceType({ url: content.image.sourceUrl })) {
      cdnResources.push(content.image.sourceUrl);
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MarkdownWithImageInfo;
