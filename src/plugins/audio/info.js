export default {
  type: 'audio',
  getName: t => t('audio:name'),
  getDefaultContent: () => ({
    type: 'internal',
    url: '',
    text: ''
  })
};
