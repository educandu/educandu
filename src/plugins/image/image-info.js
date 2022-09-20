import joi from 'joi';
import React from 'react';
import ImageIcon from './image-icon.js';
import ImageDisplay from './image-display.js';
import cloneDeep from '../../utils/clone-deep.js';
import { EFFECT_TYPE, ORIENTATION } from './constants.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import { isAccessibleStoragePath } from '../../utils/storage-utils.js';
import GithubFlavoredMarkdown from '../../common/github-flavored-markdown.js';
import { createDefaultClipEffect, createDefaultHoverEffect, createDefaultRevealEffect } from './image-utils.js';

class ImageInfo {
  static get inject() { return [GithubFlavoredMarkdown]; }

  static get typeName() { return 'image'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'image';
  }

  getName(t) {
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
      sourceType: IMAGE_SOURCE_TYPE.internal,
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
      sourceType: joi.string().valid(...Object.values(IMAGE_SOURCE_TYPE)).required(),
      sourceUrl: joi.string().allow('').required(),
      copyrightNotice: joi.string().allow('').required(),
      width: joi.number().min(0).max(100).required(),
      effectType: joi.string().valid(...Object.values(EFFECT_TYPE)).required(),
      hoverEffect: joi.object({
        sourceType: joi.string().valid(...Object.values(IMAGE_SOURCE_TYPE)).required(),
        sourceUrl: joi.string().allow('').required(),
        copyrightNotice: joi.string().allow('').required()
      }).required(),
      revealEffect: joi.object({
        sourceType: joi.string().valid(...Object.values(IMAGE_SOURCE_TYPE)).required(),
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
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    redactedContent.hoverEffect.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.hoverEffect.copyrightNotice,
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );
    redactedContent.revealEffect.copyrightNotice = this.gfm.redactCdnResources(
      redactedContent.revealEffect.copyrightNotice,
      url => isAccessibleStoragePath(url, targetRoomId) ? url : ''
    );

    if (redactedContent.sourceType === IMAGE_SOURCE_TYPE.internal
      && !isAccessibleStoragePath(redactedContent.sourceUrl, targetRoomId)
    ) {
      redactedContent.sourceUrl = '';
    }

    if (redactedContent.hoverEffect.sourceType === IMAGE_SOURCE_TYPE.internal
      && !isAccessibleStoragePath(redactedContent.hoverEffect.sourceUrl, targetRoomId)
    ) {
      redactedContent.hoverEffect.sourceUrl = '';
    }

    if (redactedContent.revealEffect.sourceType === IMAGE_SOURCE_TYPE.internal
      && !isAccessibleStoragePath(redactedContent.revealEffect.sourceUrl, targetRoomId)
    ) {
      redactedContent.revealEffect.sourceUrl = '';
    }

    return redactedContent;
  }

  getCdnResources(content) {
    const cdnResources = [];

    cdnResources.push(...this.gfm.extractCdnResources(content.copyrightNotice));
    cdnResources.push(...this.gfm.extractCdnResources(content.hoverEffect.copyrightNotice));
    cdnResources.push(...this.gfm.extractCdnResources(content.revealEffect.copyrightNotice));

    if (content.sourceType === IMAGE_SOURCE_TYPE.internal && content.sourceUrl) {
      cdnResources.push(content.sourceUrl);
    }
    if (content.hoverEffect.sourceType === IMAGE_SOURCE_TYPE.internal && content.hoverEffect.sourceUrl) {
      cdnResources.push(content.hoverEffect.sourceUrl);
    }
    if (content.revealEffect.sourceType === IMAGE_SOURCE_TYPE.internal && content.revealEffect.sourceUrl) {
      cdnResources.push(content.revealEffect.sourceUrl);
    }
    return [...new Set(cdnResources)].filter(cdnResource => cdnResource);
  }
}

export default ImageInfo;
