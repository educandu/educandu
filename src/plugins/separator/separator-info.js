import joi from 'joi';
import React from 'react';
import SeparatorIcon from './separator-icon.js';
import cloneDeep from '../../utils/clone-deep.js';
import { COLOR_INTENSITY, TITLE_POSITION } from './constants.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class SeparatorInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'separator';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('separator:name');
  }

  getIcon() {
    return <SeparatorIcon />;
  }

  async resolveDisplayComponent() {
    return (await import('./separator-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./separator-editor.js')).default;
  }

  getDefaultContent() {
    return {
      title: '',
      titlePosition: TITLE_POSITION.center,
      colorIntensity: COLOR_INTENSITY.normal,
      width: 100
    };
  }

  validateContent(content) {
    const schema = joi.object({
      title: joi.string().allow('').required(),
      titlePosition: joi.string().valid(...Object.values(TITLE_POSITION)).required(),
      colorIntensity: joi.string().valid(...Object.values(COLOR_INTENSITY)).required(),
      width: joi.number().min(0).max(100).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.title = this.gfm.redactCdnResources(
      redactedContent.title,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.title));

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default SeparatorInfo;
