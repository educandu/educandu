import joi from 'joi';
import { isInternalSourceType } from '../../utils/source-utils.js';
import validation, { URL_VALIDATION_STATUS } from '../../ui/validation.js';
import { DISPLAY_MODE, DEFAULT_MAX_TILES_PER_ROW, TILES_HOVER_EFFECT, LINK_SOURCE_TYPE } from './constants.js';

function createDefaultItemImage() {
  return {
    sourceUrl: ''
  };
}

export function createDefaultItem(index, t) {
  return {
    title: `[${t('catalog:itemNumber', { number: index + 1 })}]`,
    image: createDefaultItemImage(),
    link: {
      sourceType: LINK_SOURCE_TYPE.document,
      sourceUrl: '',
      documentId: null
    }
  };
}

function ceateDefaultImageTileConfig() {
  return {
    maxTilesPerRow: DEFAULT_MAX_TILES_PER_ROW,
    hoverEffect: TILES_HOVER_EFFECT.none
  };
}

export function createDefaultContent(t) {
  return {
    displayMode: DISPLAY_MODE.linkList,
    title: `[${t('common:title')}]`,
    width: 100,
    items: Array.from({ length: DEFAULT_MAX_TILES_PER_ROW }, (_, index) => createDefaultItem(index, t)),
    imageTilesConfig: ceateDefaultImageTileConfig()
  };
}

export function validateContent(content) {
  const schema = joi.object({
    displayMode: joi.string().valid(...Object.values(DISPLAY_MODE)).required(),
    title: joi.string().allow('').required(),
    width: joi.number().min(0).max(100).required(),
    items: joi.array().items(joi.object({
      title: joi.string().allow('').required(),
      image: joi.object({
        sourceUrl: joi.string().allow('').required()
      }).required(),
      link: joi.object({
        sourceType: joi.string().valid(...Object.values(LINK_SOURCE_TYPE)).required(),
        sourceUrl: joi.string().allow('').required(),
        documentId: joi.string().allow(null).required()
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
      imageTilesConfig: ceateDefaultImageTileConfig()
    };
  }

  return content;
}

export function isItemInvalid(item, cdnRootUrl) {
  const isInvalidImageSourceUrl
    = !isInternalSourceType({ url: item.image.sourceUrl, cdnRootUrl })
    && validation.getUrlValidationStatus(item.image.sourceUrl) === URL_VALIDATION_STATUS.error;

  const isInvalidLinkSourceUrl
    = item.link.sourceType === LINK_SOURCE_TYPE.external
    && validation.getUrlValidationStatus(item.link.sourceUrl, { allowHttp: true, allowMailto: true }) === URL_VALIDATION_STATUS.error;

  return isInvalidImageSourceUrl || isInvalidLinkSourceUrl;
}

export function isContentInvalid(content, cdnRootUrl) {
  return content.items.some(item => isItemInvalid(item, cdnRootUrl));
}
