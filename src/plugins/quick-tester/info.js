import React from 'react';
import iconNs from '@ant-design/icons';
import { TESTS_ORDER } from './constants.js';
import cloneDeep from '../../utils/clone-deep.js';
import QuickTesterIcon from './quick-tester-icon.js';

const Icon = iconNs.default || iconNs;

export default class QuickTester {
  static get typeName() { return 'quick-tester'; }

  constructor() {
    this.type = 'quick-tester';
  }

  getName(t) {
    return t('quickTester:name');
  }

  getIcon() {
    return <Icon component={QuickTesterIcon} />;
  }

  getDefaultContent(t) {
    return {
      title: `[${t('common:title')}]`,
      teaser: `[${t('quickTester:teaserLabel')}]`,
      tests: [
        {
          question: `[${t('quickTester:question')}]`,
          answer: `[${t('quickTester:answer')}]`
        }
      ],
      testsOrder: TESTS_ORDER.given
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources() {
    return [];
  }
}
