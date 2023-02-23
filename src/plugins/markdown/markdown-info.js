import joi from 'joi';
import React from 'react';
import MarkdownIcon from './markdown-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import MarkdownDisplay from './markdown-display.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class MarkdownInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'markdown';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('markdown:name');
  }

  getIcon() {
    return <MarkdownIcon />;
  }

  getDisplayComponent() {
    return MarkdownDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./markdown-editor.js')).default;
  }

  getDefaultContent() {
    return {
      text: '',
      width: 100
    };
  }

  validateContent(content) {
    const schema = joi.object({
      text: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required()
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

export default MarkdownInfo;
