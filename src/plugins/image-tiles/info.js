import { IMAGE_TYPE } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'image-tiles',
  getName: t => t('imageTiles:name'),
  getDefaultContent: () => ({
    tiles: [],
    maxTilesPerRow: 3,
    maxWidth: 100,
    hoverEffect: 'none'
  }),
  cloneContent: content => cloneDeep(content),
  getCdnResources: content => content.tiles.filter(tile => tile.image?.type === IMAGE_TYPE.internal && tile.image.url).map(tile => tile.image.url)
};
