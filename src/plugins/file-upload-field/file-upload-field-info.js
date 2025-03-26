import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { PLUGIN_GROUP } from '../../domain/constants.js';
import FileUploadFieldIcon from './file-upload-field-icon.js';
import { MAXIMUM_ALLOWED_UPLOAD_FILE_COUNT } from './constants.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class FileUploadFieldInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'file-upload-field';

  allowsInput = true;

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('fileUploadField:name');
  }

  getIcon() {
    return <FileUploadFieldIcon />;
  }

  getGroups() {
    return [PLUGIN_GROUP.userInput];
  }

  async resolveDisplayComponent() {
    return (await import('./file-upload-field-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./file-upload-field-editor.js')).default;
  }

  getDefaultContent() {
    return {
      label: '',
      maxCount: 1,
      width: 100,
      allowDragAndDrop: true
    };
  }

  validateContent(content) {
    const schema = joi.object({
      label: joi.string().allow('').required(),
      maxCount: joi.number().integer().min(1).max(MAXIMUM_ALLOWED_UPLOAD_FILE_COUNT).required(),
      width: joi.number().integer().min(0).max(100).required(),
      allowDragAndDrop: joi.boolean().required()
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

export default FileUploadFieldInfo;
