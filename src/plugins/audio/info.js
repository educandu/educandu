import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'audio',
  getName: t => t('audio:name'),
  getDefaultContent: () => ({
    type: 'internal',
    url: '',
    text: ''
  }),
  cloneContent: content => cloneDeep(content)
};
