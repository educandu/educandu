import validation from '../../ui/validation.js';
import { DEFAULT_MAX_TILES_PER_ROW, HOVER_EFFECT, IMAGE_SOURCE_TYPE, LINK_SOURCE_TYPE } from './constants.js';

export function createDefaultTile(number, t) {
  return {
    image: {
      sourceType: IMAGE_SOURCE_TYPE.external,
      sourceUrl: ''
    },
    description: `[${t('imageTiles:tileNumber', { number })}]`,
    link: {
      sourceType: LINK_SOURCE_TYPE.external,
      sourceUrl: '',
      documentId: ''
    }
  };
}

export function createDefaultContent(t) {
  return {
    tiles: [...new Array(DEFAULT_MAX_TILES_PER_ROW).keys()].map(index => createDefaultTile(index + 1, t)),
    maxTilesPerRow: DEFAULT_MAX_TILES_PER_ROW,
    maxWidth: 100,
    hoverEffect: HOVER_EFFECT.none
  };
}

export function isTileInvalid(tile, t) {
  const isInvalidImageSourceUrl
    = tile.image.sourceType === IMAGE_SOURCE_TYPE.external
    && validation.validateUrl(tile.image.sourceUrl, t).validateStatus === 'error';

  const isInvalidLinkSourceUrl
    = tile.link.sourceType === LINK_SOURCE_TYPE.external
    && validation.validateUrl(tile.link.sourceUrl, t).validateStatus === 'error';

  return isInvalidImageSourceUrl || isInvalidLinkSourceUrl;
}

export function isContentInvalid(content, t) {
  return content.tiles.some(tile => isTileInvalid(tile, t));
}
