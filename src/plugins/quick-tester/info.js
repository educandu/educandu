import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import { CheckSquareOutlined } from '@ant-design/icons';

export default class QuickTester {
  static get typeName() { return 'quick-tester'; }

  constructor() {
    this.type = 'quick-tester';
  }

  getName(t) {
    return t('quickTester:name');
  }

  getIcon() {
    return <CheckSquareOutlined />;
  }

  getDefaultContent(t) {
    return {
      title: `[${t('quickTester:titleLabel')}]`,
      teaser: `[${t('quickTester:teaserLabel')}]`,
      tests: [
        {
          question: `[${t('quickTester:question')}]`,
          answer: `[${t('quickTester:answer')}]`
        }
      ]
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources() {
    return [];
  }
}
