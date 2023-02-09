import joi from 'joi';
import uniqueId from '../../utils/unique-id.js';
import { maxDocumentCommentTextLength } from '../../domain/validation-constants.js';
import { DISPLAY_MODE, DEFAULT_MAX_TILES_PER_ROW, TILES_HOVER_EFFECT, LINK_SOURCE_TYPE } from './constants.js';

function createDefaultItemImage() {
  return {
    sourceUrl: ''
  };
}

export function createDefaultItem() {
  return {
    _id: uniqueId.create(),
    title: '',
    image: createDefaultItemImage(),
    link: {
      sourceType: LINK_SOURCE_TYPE.document,
      sourceUrl: '',
      documentId: null,
      description: ''
    }
  };
}

function createDefaultImageTileConfig() {
  return {
    maxTilesPerRow: DEFAULT_MAX_TILES_PER_ROW,
    hoverEffect: TILES_HOVER_EFFECT.none
  };
}

export function createDefaultContent() {
  return {
    displayMode: DISPLAY_MODE.linkList,
    title: '',
    width: 100,
    items: Array.from({ length: DEFAULT_MAX_TILES_PER_ROW }, createDefaultItem),
    imageTilesConfig: createDefaultImageTileConfig()
  };
}

export function validateContent(content) {
  const schema = joi.object({
    displayMode: joi.string().valid(...Object.values(DISPLAY_MODE)).required(),
    title: joi.string().allow('').required(),
    width: joi.number().min(0).max(100).required(),
    items: joi.array().items(joi.object({
      _id: joi.string().required(),
      title: joi.string().allow('').required(),
      image: joi.object({
        sourceUrl: joi.string().allow('').required()
      }).required(),
      link: joi.object({
        sourceType: joi.string().valid(...Object.values(LINK_SOURCE_TYPE)).required(),
        sourceUrl: joi.string().allow('').required(),
        documentId: joi.string().allow(null).required(),
        description: joi.string().allow('').max(maxDocumentCommentTextLength).required()
      }).required()
    })).required(),
    imageTilesConfig: joi.object({
      maxTilesPerRow: joi.number().min(1).required(),
      hoverEffect: joi.string().valid(...Object.values(TILES_HOVER_EFFECT)).required()
    }).required()
  });

  joi.attempt(content, schema, { abortEarly: false, convert: false, noDefaults: true });
}

export function consolidateForDisplayMode(content) {
  if (content.displayMode !== DISPLAY_MODE.imageTiles) {
    return {
      ...content,
      items: content.items.map(item => ({ ...item, image: createDefaultItemImage() })),
      imageTilesConfig: createDefaultImageTileConfig()
    };
  }

  return content;
}
