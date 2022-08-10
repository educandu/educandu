import React from 'react';
import MarkdownIcon from './markdown-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import MarkdownDisplay from './markdown-display.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class MarkdownInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'markdown'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'markdown';
  }

  getName(t) {
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
      text: ''
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.text = this.gfm.redactCdnResources(
      redactedContent.text,
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    return redactedContent;
  }

  getCdnResources(content) {
    return this.gfm.extractCdnResources(content.text);
  }
}

export default MarkdownInfo;
