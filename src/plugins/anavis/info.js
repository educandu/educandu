export default {
  type: 'anavis',
  getName: t => t('anavis:name'),
  getDefaultContent: t => ({
    width: 100,
    parts: [
      {
        color: '#4582b4',
        name: t('anavis:defaultPartName'),
        length: 1000,
        annotations: []
      }
    ],
    media: {
      kind: 'video',
      type: 'youtube',
      url: '',
      text: '',
      aspectRatio: {
        h: 16,
        v: 9
      }
    }
  })
};
