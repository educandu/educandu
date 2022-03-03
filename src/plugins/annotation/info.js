import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import AnnotationIcon from './annotation-icon.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

export default class Annotation {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'annotation'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'annotation';
  }

  getName(t) {
    return t('annotation:name');
  }

  getIcon() {
    return <AnnotationIcon />;
  }

  getDefaultContent(t) {
    return {
      title: `[${t('common:title')}]`,
      text: `[${t('common:text')}]`,
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
