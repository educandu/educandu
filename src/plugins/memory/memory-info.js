import joi from 'joi';
import React from 'react';
import MemoryIcon from './memory-icon.js';
import { DIMENSION } from './constants.js';
import MemoryDisplay from './memory-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { createDefaultTile, getTilePairCountByDimension } from './memory-utils.js';

class MemoryInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'memory'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'memory';
  }

  getName(t) {
    return t('memory:name');
  }

  getIcon() {
    return <MemoryIcon />;
  }

  getDisplayComponent() {
    return MemoryDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./memory-editor.js')).default;
  }

  getDefaultContent() {
    const dimension = DIMENSION.threeByThree;
    const tilePairCount = getTilePairCountByDimension(dimension);
    const tilePairs = Array.from(
      { length: tilePairCount },
      () => [createDefaultTile(), createDefaultTile()]
    );

    return {
      title: '',
      dimension,
      tilePairs
    };
  }

  validateContent(content) {
    const tileSchema = joi.object({
      text: joi.string().allow('').required()
    });
    const tilePairSchema = joi.array().items(tileSchema).length(2);
    const allowedTilePairs = getTilePairCountByDimension(content.dimension);

    const schema = joi.object({
      title: joi.string().allow('').required(),
      dimension: joi.string(...Object.values(DIMENSION)).required(),
      tilePairs: joi.array().items(tilePairSchema).length(allowedTilePairs).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  // eslint-disable-next-line no-unused-vars
  redactContent(content, _targetRoomId) {
    const redactedContent = cloneDeep(content);
    return redactedContent;
  }

  // eslint-disable-next-line no-unused-vars
  getCdnResources(_content) {
    return [];
  }
}

export default MemoryInfo;
