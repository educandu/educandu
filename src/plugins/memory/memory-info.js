import joi from 'joi';
import React from 'react';
import { SIZE } from './constants.js';
import MemoryIcon from './memory-icon.js';
import MemoryDisplay from './memory-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { createDefaultTile, getTilePairCountBySize } from './memory-utils.js';
import { couldAccessUrlFromRoom, isInternalSourceType } from '../../utils/source-utils.js';

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
    const size = SIZE.threeByThree;
    const tilePairCount = getTilePairCountBySize(size);
    const tilePairs = Array.from(
      { length: tilePairCount },
      () => [createDefaultTile(), createDefaultTile()]
    );

    return {
      size,
      tilePairs,
      width: 100
    };
  }

  validateContent(content) {
    const tileSchema = joi.object({
      text: joi.string().allow('').required(),
      sourceUrl: joi.string().allow('').required()
    });
    const tilePairSchema = joi.array().items(tileSchema).length(2);
    const allowedTilePairs = getTilePairCountBySize(content.size);

    const schema = joi.object({
      size: joi.string().valid(...Object.values(SIZE)).required(),
      tilePairs: joi.array().items(tilePairSchema).length(allowedTilePairs).required(),
      width: joi.number().min(0).max(100).required()
    });

    joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    redactedContent.tilePairs.forEach(tilePair => {
      tilePair[0].text = this._redactTileText(tilePair[0].text, targetRoomId);
      tilePair[1].text = this._redactTileText(tilePair[1].text, targetRoomId);

      if (!couldAccessUrlFromRoom(tilePair[0].sourceUrl, targetRoomId)) {
        tilePair[0].sourceUrl = '';
      }

      if (!couldAccessUrlFromRoom(tilePair[1].sourceUrl, targetRoomId)) {
        tilePair[1].sourceUrl = '';
      }
    });

    return redactedContent;
  }

  _redactTileText(text, targetRoomId) {
    return this.gfm.redactCdnResources(
      text,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );
  }

  getCdnResources(content) {
    const cdnResources = content.tilePairs.map(tilePair => {
      const pairResources = [
        ...this.gfm.extractCdnResources(tilePair[0].text),
        ...this.gfm.extractCdnResources(tilePair[1].text)
      ];

      if (isInternalSourceType({ url: tilePair[0].sourceUrl })) {
        pairResources.push(tilePair[0].sourceUrl);
      }

      if (isInternalSourceType({ url: tilePair[1].sourceUrl })) {
        pairResources.push(tilePair[1].sourceUrl);
      }

      return pairResources;
    }).flat();

    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default MemoryInfo;
