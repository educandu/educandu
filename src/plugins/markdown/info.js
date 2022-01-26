import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { FileMarkdownOutlined } from '@ant-design/icons';
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
    return <FileMarkdownOutlined />;
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
