import React from 'react';
import MarkdownIcon from './markdown-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

export default class Markdown {
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

  getDefaultContent() {
    return {
      text: '',
      renderMedia: false
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources(content) {
    return this.gfm.extractCdnResources(content.text || '');
  }
}
