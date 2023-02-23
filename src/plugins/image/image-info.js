import joi from 'joi';
import React from 'react';
import ImageIcon from './image-icon.js';
import ImageDisplay from './image-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { EFFECT_TYPE, ORIENTATION } from './constants.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { isInternalSourceType, couldAccessUrlFromRoom } from '../../utils/source-utils.js';
import { createDefaultClipEffect, createDefaultHoverEffect, createDefaultRevealEffect } from './image-utils.js';

class ImageInfo {
  static dependencies = [GithubFlavoredMarkdown];

  static typeName = 'image';

  constructor(gfm) {
    this.gfm = gfm;
  }

  getDisplayName(t) {
    return t('image:name');
  }

  getIcon() {
    return <ImageIcon />;
  }

  getDisplayComponent() {
    return ImageDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./image-editor.js')).default;
  }

  getDefaultContent() {
    return {
      sourceUrl: '',
      copyrightNotice: '',
      width: 100,
      effectType: EFFECT_TYPE.none,
      hoverEffect: createDefaultHoverEffect(),
      revealEffect: createDefaultRevealEffect(),
      clipEffect: createDefaultClipEffect()
    };
  }

  validateContent(content) {
    const schema = joi.object({
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required(),
      effectType: joi.string().valid(...Object.values(EFFECT_TYPE)).required(),
      hoverEffect: joi.object({
        sourceUrl: joi.string().allow('').required(),
        copyrightNotice: joi.string().allow('').required()
      }).required(),
      revealEffect: joi.object({
        sourceUrl: joi.string().allow('').required(),
        copyrightNotice: joi.string().allow('').required(),
        startPosition: joi.number().min(0).required(),
        orientation: joi.string().valid(...Object.values(ORIENTATION)).required()
      }).required(),
      clipEffect: joi.object({
        region: joi.object({
          x: joi.number().min(0).required(),
          y: joi.number().min(0).required(),
          width: joi.number().min(0).required(),
          height: joi.number().min(0).required()
        }).required()
      }).required()
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

    redactedContent.hoverEffect.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.hoverEffect.copyrightNotice,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );
    redactedContent.revealEffect.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.revealEffect.copyrightNotice,
      url => couldAccessUrlFromRoom(url, targetRoomId) ? url : ''
    );

    if (!couldAccessUrlFromRoom(redactedContent.sourceUrl, targetRoomId)) {
      redactedContent.sourceUrl = '';
    }

    if (!couldAccessUrlFromRoom(redactedContent.hoverEffect.sourceUrl, targetRoomId)) {
      redactedContent.hoverEffect.sourceUrl = '';
    }

    if (!couldAccessUrlFromRoom(redactedContent.revealEffect.sourceUrl, targetRoomId)) {
      redactedContent.revealEffect.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.copyrightNotice));
    cdnResources.push(...this.gfm.extractCdnResources(content.hoverEffect.copyrightNotice));
    cdnResources.push(...this.gfm.extractCdnResources(content.revealEffect.copyrightNotice));

    if (isInternalSourceType({ url: content.sourceUrl })) {
      cdnResources.push(content.sourceUrl);
    }
    if (isInternalSourceType({ url: content.hoverEffect.sourceUrl })) {
      cdnResources.push(content.hoverEffect.sourceUrl);
    }
    if (isInternalSourceType({ url: content.revealEffect.sourceUrl })) {
      cdnResources.push(content.revealEffect.sourceUrl);
    }
    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default ImageInfo;
