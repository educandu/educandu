import cloneDeep from '../../utils/clone-deep';

export default {
  type: 'h5p-player',
  getName: t => t('h5pPlayer:name'),
  getDefaultContent: () => ({
    contentId: null,
    maxWidth: 100
  }),
  cloneContent: content => cloneDeep(content)
};
