export default {
  type: 'diagram-net',
  getName: t => t('diagramNet:name'),
  getDefaultContent: () => ({
    xml: null,
    image: null,
    maxWidth: 100
  })
};
