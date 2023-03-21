import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { BEHAVIOR, COLOR_SCHEME, TYPE } from './constants.js';
import MusicAccentuationIcon from './music-accentuation-icon.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class MusicAccentuationInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'music-accentuation';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('musicAccentuation:name');
  }

  getIcon() {
    return <MusicAccentuationIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./music-accentuation-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./music-accentuation-editor.js')).default;
  }

  getDefaultContent() {
    return {
      type: TYPE.hint,
      colorScheme: COLOR_SCHEME.blue,
      behavior: BEHAVIOR.expandable,
      text: '',
      width: 100
    };
  }

  validateContent(content) {
    const schema = joi.object({
      type: joi.string().valid(...Object.values(TYPE)).required(),
      colorScheme: joi.string().valid(...Object.values(COLOR_SCHEME)).required(),
      behavior: joi.string().valid(...Object.values(BEHAVIOR)).required(),
      text: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required()
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
    const cdnResources = [...this.gfm.extractCdnResources(content.text)];

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MusicAccentuationInfo;
