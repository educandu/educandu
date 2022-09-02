import validation from '../../ui/validation.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import { DISPLAY_MODE, DEFAULT_MAX_TILES_PER_ROW, TILES_HOVER_EFFECT, LINK_SOURCE_TYPE } from './constants.js';

function createDefaultItemImage() {
  return {
    sourceType: IMAGE_SOURCE_TYPE.internal,
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
      documentId: ''
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

export function isItemInvalid(item, t) {
  const isInvalidImageSourceUrl
    = item.image.sourceType === IMAGE_SOURCE_TYPE.external
    && validation.validateUrl(item.image.sourceUrl, t).validateStatus === 'error';

  const isInvalidLinkSourceUrl
    = item.link.sourceType === LINK_SOURCE_TYPE.external
    && validation.validateUrl(item.link.sourceUrl, t, { allowHttp: true, allowMailto: true }).validateStatus === 'error';

  return isInvalidImageSourceUrl || isInvalidLinkSourceUrl;
}

export function isContentInvalid(content, t) {
  return content.items.some(item => isItemInvalid(item, t));
}
