import joi from 'joi';
import React from 'react';
import TextFieldIcon from './text-field-icon.js';
import { TEXT_FIELD_MODE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import { PLUGIN_GROUP } from '../../domain/constants.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class TextFieldInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'text-field';

  allowsInput = true;

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('textField:name');
  }

  getIcon() {
    return <TextFieldIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.userInput];
  }

  async resolveDisplayComponent() {
    return (await import('./text-field-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./text-field-editor.js')).default;
  }

  getDefaultContent() {
    return {
      mode: TEXT_FIELD_MODE.singleLine,
      label: '',
      maxLength: 0,
      width: 100
    };
  }

  validateContent(content) {
    const schema = joi.object({
      mode: joi.string().valid(...Object.values(TEXT_FIELD_MODE)).required(),
      label: joi.string().allow('').required(),
      maxLength: joi.number().integer().min(0).max(Number.MAX_SAFE_INTEGER).required(),
      width: joi.number().integer().min(0).max(100).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
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

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.label));

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default TextFieldInfo;
