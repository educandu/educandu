export default {
  type: 'image',
  getName: t => t('image:name'),
  getDefaultContent: () => ({
    type: 'internal',
    url: '',
    maxWidth: 100,
    text: '',
    hover: null
  })
};
