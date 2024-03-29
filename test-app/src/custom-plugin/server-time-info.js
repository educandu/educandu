import joi from 'joi';
import React from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import cloneDeep from '../../../src/utils/clone-deep.js';
import { couldAccessUrlFromRoom } from '../../../src/utils/source-utils.js';
import GithubFlavoredMarkdown from '../../../src/common/github-flavored-markdown.js';

class ServerTimeInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'custom-plugin/server-time';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('customPlugin/serverTime:name');
  }

  getIcon() {
    return <ClockCircleOutlined />;
  }

  async resolveDisplayComponent() {
    return (await import('./server-time-display.js')).default;
  }

  async resolveEditorComponent() {
    return (await import('./server-time-editor.js')).default;
  }

  getDefaultContent() {
    return {
      text: '',
      width: 100
    };
  }

  validateContent(content) {
    const schema = joi.object({
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
    return this.gfm.extractCdnResources(content.text);
  }
}

export default ServerTimeInfo;
