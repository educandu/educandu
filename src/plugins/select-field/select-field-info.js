import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import SelectFieldIcon from './select-field-icon.js';
import { PLUGIN_GROUP } from '../../domain/constants.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { createDefaultContent, validateContent } from './select-field-utils.js';

class SelectFieldInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'select-field';

  allowsInput = true;

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('selectField:name');
  }

  getIcon() {
    return <SelectFieldIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.userInput];
  }

  async resolveDisplayComponent() {
    return (await import('./select-field-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./select-field-editor.js')).default;
  }

  getDefaultContent() {
    return createDefaultContent();
  }

  validateContent(content) {
    validateContent(content);
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.label = this.gfm.redactCdnResources(
      redactedContent.label,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    for (const item of redactedContent.items) {
      item.text = this.gfm.redactCdnResources(
        item.text,
        url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
      );
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.label));

    for (const item of content.items) {
      cdnResources.push(...this.gfm.extractCdnResources(item.text));
    }

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default SelectFieldInfo;
