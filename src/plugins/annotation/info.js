export default {
  type: 'annotation',
  getName: t => t('annotation:name'),
  getDefaultContent: () => ({
    title: '',
    text: ''
  })
};
