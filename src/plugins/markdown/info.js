import cloneDeep from '../../utils/clone-deep';

export default {
  type: 'markdown',
  getName: t => t('markdown:name'),
  getDefaultContent: () => ({
    text: ''
  }),
  cloneContent: content => cloneDeep(content)
};
