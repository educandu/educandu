import validation from '../../ui/validation.js';
import { IMAGE_SOURCE_TYPE } from '../../domain/constants.js';
import { DEFAULT_MAX_TILES_PER_ROW, HOVER_EFFECT, LINK_SOURCE_TYPE } from './constants.js';

export function createDefaultTile(number, t) {
  return {
    image: {
      sourceType: IMAGE_SOURCE_TYPE.internal,
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
    tiles: Array.from({ length: DEFAULT_MAX_TILES_PER_ROW }, (_, index) => createDefaultTile(index + 1, t)),
    maxTilesPerRow: DEFAULT_MAX_TILES_PER_ROW,
    width: 100,
    hoverEffect: HOVER_EFFECT.none
  };
}

export function isTileInvalid(tile, t) {
  const isInvalidImageSourceUrl
    = tile.image.sourceType === IMAGE_SOURCE_TYPE.external
    && validation.validateUrl(tile.image.sourceUrl, t).validateStatus === 'error';

  const isInvalidLinkSourceUrl
    = tile.link.sourceType === LINK_SOURCE_TYPE.external
    && validation.validateUrl(tile.link.sourceUrl, t, { allowHttp: true, allowMailto: true }).validateStatus === 'error';

  return isInvalidImageSourceUrl || isInvalidLinkSourceUrl;
}

export function isContentInvalid(content, t) {
  return content.tiles.some(tile => isTileInvalid(tile, t));
}
