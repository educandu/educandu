import cloneDeep from '../../utils/clone-deep';

export default {
  type: 'diagram-net',
  getName: t => t('diagramNet:name'),
  getDefaultContent: () => ({
    xml: null,
    image: null,
    maxWidth: 100
  }),
  cloneContent: content => cloneDeep(content)
};
