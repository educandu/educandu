import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'annotation',
  getName: t => t('annotation:name'),
  getDefaultContent: () => ({
    title: '',
    text: ''
  }),
  cloneContent: content => cloneDeep(content),
  getCdnResources: () => []
};
