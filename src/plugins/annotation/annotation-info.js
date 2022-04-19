import React from 'react';
import { STATE, INTENT } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import AnnotationIcon from './annotation-icon.js';
import AnnotationDisplay from './annotation-display.js';
import { isAccessibleStoragePath } from '../../ui/path-helper.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class AnnotationInfo {
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

  getDisplayComponent() {
    return AnnotationDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./annotation-editor.js')).default;
  }

  getDefaultContent(t) {
    return {
      title: `[${t('common:title')}]`,
      text: `[${t('common:text')}]`,
      renderMedia: false,
      state: STATE.collapsed,
      intent: INTENT.neutral
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

export default AnnotationInfo;
