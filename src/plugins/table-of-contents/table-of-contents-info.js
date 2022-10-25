import joi from 'joi';
import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import TableOfContentsIcon from './table-of-contents-icon.js';
import TableOfContentsDisplay from './table-of-contents-display.js';

class TableOfContentsInfo {
  static get typeName() { return 'table-of-contents'; }

  static get inject() { return []; }

  constructor() {
    this.type = 'table-of-contents';
  }

  getName(t) {
    return t('tableOfContents:name');
  }

  getIcon() {
    return <TableOfContentsIcon />;
  }

  getDisplayComponent() {
    return TableOfContentsDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./table-of-contents-editor.js')).default;
  }

  getDefaultContent() {
    return {
      minLevel: 1,
      maxLevel: 6
    };
  }

  validateContent(content) {
    const schema = joi.object({
      minLevel: joi.number().min(1).max(6).required(),
      maxLevel: joi.number().min(1).max(6).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  // eslint-disable-next-line no-unused-vars
  redactContent(content, _targetRoomId) {
    return cloneDeep(content);
  }

  // eslint-disable-next-line no-unused-vars
  getCdnResources(_content) {
    return [];
  }
}

export default TableOfContentsInfo;
