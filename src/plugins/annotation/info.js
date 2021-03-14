import cloneDeep from '../../utils/clone-deep';

export default {
  type: 'annotation',
  getName: t => t('annotation:name'),
  getDefaultContent: () => ({
    title: '',
    text: ''
  }),
  cloneContent: content => cloneDeep(content)
};
