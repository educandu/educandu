import joi from 'joi';
import React from 'react';
import { IMAGE_POSITION } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import MarkdownWithImageIcon from './markdown-with-image-icon.js';
import MarkdownWithImageDisplay from './markdown-with-image-display.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { couldAccessUrlFromRoom, isInternalSourceType } from '../../utils/source-utils.js';

class MarkdownWithImageInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'markdown-with-image'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'markdown-with-image';
  }

  getName(t) {
    return t('markdownWithImage:name');
  }

  getIcon() {
    return <MarkdownWithImageIcon />;
  }

  getDisplayComponent() {
    return MarkdownWithImageDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./markdown-with-image-editor.js')).default;
  }

  getDefaultContent() {
    return {
      text: '',
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
