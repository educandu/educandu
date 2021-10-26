import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'image',
  getName: t => t('image:name'),
  getDefaultContent: () => ({
    sourceType: 'internal',
    sourceUrl: '',
    maxWidth: 100,
    text: '',
    effect: null
  }),
  cloneContent: content => cloneDeep(content)
};
