import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'abc-notation',
  getName: t => t('abcNotation:name'),
  getDefaultContent: () => ({
    abcCode: '',
    maxWidth: 100,
    displayMidi: true,
    text: ''
  }),
  cloneContent: content => cloneDeep(content),
  getCdnResources: () => []
};
