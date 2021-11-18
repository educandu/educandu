import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'markdown',
  getName: t => t('markdown:name'),
  getDefaultContent: () => ({
    text: ''
  }),
  cloneContent: content => cloneDeep(content),
  getCdnResources: () => []
};
