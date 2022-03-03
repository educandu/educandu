import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import IntervalTrainerIcon from './interval-trainer-icon.js';

export default class IntervalTrainer {
  static get typeName() { return 'interval-trainer'; }

  constructor() {
    this.type = 'interval-trainer';
  }

  getName(t) {
    return t('intervalTrainer:name');
  }

  getIcon() {
    return <IntervalTrainerIcon />;
  }

  getDefaultContent() {
    return {
      title: '',
      keyboardShortcuts: 'Q2W3ER5T6Z7UYSXDCVGBHNJM',
      keyboardStart: 0,
      keyboardEnd: 24,
      keyboardOffset: 48,
      tests: []
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  getCdnResources() {
    return [];
  }
}
