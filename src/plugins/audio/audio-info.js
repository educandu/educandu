import React from 'react';
import AudioIcon from './audio-icon.js';
import { SOURCE_TYPE } from './constants.js';
import AudioDisplay from './audio-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { isAccessibleStoragePath } from '../../ui/path-helper.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class AudioInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'audio'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'audio';
  }

  getName(t) {
    return t('audio:name');
  }

  getIcon() {
    return <AudioIcon />;
  }

  getDisplayComponent() {
    return AudioDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./audio-editor.js')).default;
  }

  getDefaultContent() {
    return {
      type: SOURCE_TYPE.internal,
      url: '',
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

    if (redactedContent.type === SOURCE_TYPE.internal && !isAccessibleStoragePath(redactedContent.url, targetRoomId)) {
      redactedContent.url = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.text));

    if (content.type === SOURCE_TYPE.internal && content.url) {
      cdnResources.push(content.url);
    }

    return cdnResources;
  }
}

export default AudioInfo;
