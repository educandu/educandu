import cloneDeep from '../../utils/clone-deep';

export default {
  type: 'image-tiles',
  getName: t => t('imageTiles:name'),
  getDefaultContent: () => ({
    tiles: [],
    maxTilesPerRow: 3,
    maxWidth: 100,
    hoverEffect: 'none'
  }),
  cloneContent: content => cloneDeep(content)
};
