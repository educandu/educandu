import cloneDeep from '../../utils/clone-deep';

export default {
  type: 'interval-trainer',
  getName: t => t('intervalTrainer:name'),
  getDefaultContent: () => ({
    title: '',
    keyboardShortcuts: 'Q2W3ER5T6Z7UYSXDCVGBHNJM',
    keyboardStart: 0,
    keyboardEnd: 24,
    keyboardOffset: 48,
    tests: []
  }),
  cloneContent: content => cloneDeep(content)
};
