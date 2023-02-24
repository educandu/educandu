import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import TableOfContentsIcon from './table-of-contents-icon.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class TableOfContentsInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'table-of-contents';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('tableOfContents:name');
  }

  getIcon() {
    return <TableOfContentsIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./table-of-contents-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./table-of-contents-editor.js')).default;
  }

  getDefaultContent(t) {
    return {
      minLevel: 1,
      maxLevel: 6,
      text: t('tableOfContents:defaultTextMarkdown')
    };
  }

  validateContent(content) {
    const schema = joi.object({
      minLevel: joi.number().min(1).max(6).required(),
      maxLevel: joi.number().min(1).max(6).required(),
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

export default TableOfContentsInfo;
