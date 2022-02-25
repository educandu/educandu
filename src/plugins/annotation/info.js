import React from 'react';
import iconNs from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import AnnotationIcon from './annotation-icon.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

const Icon = iconNs.default || iconNs;

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
    return <Icon component={AnnotationIcon} />;
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
