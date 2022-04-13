import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import AbcNotationIcon from './abc-notation-icon.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { isAccessibleStoragePath } from '../../ui/path-helper.js';

export default class AbcNotation {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'abc-notation'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'abc-notation';
  }

  getName(t) {
    return t('abcNotation:name');
  }

  getIcon() {
    return <AbcNotationIcon />;
  }

  getDefaultContent() {
    return {
      abcCode: '',
      maxWidth: 100,
      displayMidi: true,
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
