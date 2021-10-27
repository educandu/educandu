import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'iframe',
  getName: t => t('iframe:name'),
  getDefaultContent: () => ({
    url: '',
    width: 100,
    height: 150,
    isBorderVisible: true
  }),
  cloneContent: content => cloneDeep(content)
};
