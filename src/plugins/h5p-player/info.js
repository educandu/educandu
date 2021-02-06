export default {
  type: 'h5p-player',
  getName: t => t('h5pPlayer:name'),
  getDefaultContent: () => ({
    contentId: null,
    maxWidth: 100
  })
};
