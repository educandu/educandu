import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import AbcNotationIcon from './abc-notation-icon.js';
import AbcNotationDisplay from './abc-notation-display.js';
import { couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';

class AbcNotationInfo {
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

  getDisplayComponent() {
    return AbcNotationDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./abc-notation-editor.js')).default;
  }

  getDefaultContent() {
    return {
      abcCode: '',
      width: 100,
      displayMidi: true,
      copyrightNotice: ''
    };
  }

  validateContent(content) {
    const schema = joi.object({
      abcCode: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required(),
      displayMidi: joi.boolean().required(),
      copyrightNotice: joi.string().allow('').required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.copyrightNotice,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    return redactedContent;
  }

  getCdnResources(content) {
    return this.gfm.extractCdnResources(content.copyrightNotice);
  }
}

export default AbcNotationInfo;
