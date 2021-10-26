import cloneDeep from '../../utils/clone-deep.js';

export default {
  type: 'quick-tester',
  getName: t => t('quickTester:name'),
  getDefaultContent: t => ({
    title: `[${t('quickTester:titleLabel')}}`,
    teaser: `[${t('quickTester:teaserLabel')}}`,
    tests: [
      {
        question: `[${t('quickTester:question')}}`,
        answer: `[${t('quickTester:answer')}}`
      }
    ]
  }),
  cloneContent: content => cloneDeep(content)
};
