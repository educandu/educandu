import cloneDeep from '../../utils/clone-deep';

export default {
  type: 'ear-training',
  getName: t => t('earTraining:name'),
  getDefaultContent: () => ({
    title: '',
    maxWidth: 100,
    tests: [
      {
        startAbcCode: 'X:1',
        fullAbcCode: 'X:1',
        sound: {
          type: 'midi',
          url: null,
          text: null
        }
      }
    ]
  }),
  cloneContent: content => cloneDeep(content)
};
