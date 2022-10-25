import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import MarkdownWithImageIcon from './markdown-with-image-icon.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import MarkdownWithImageDisplay from './markdown-with-image-display.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

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
      text: ''
    };
  }

  validateContent(content) {
    const schema = joi.object({
      text: joi.string().allow('').required()
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

    return redactedContent;
  }

  getCdnResources(content) {
    return this.gfm.extractCdnResources(content.text);
  }
}

export default MarkdownWithImageInfo;
