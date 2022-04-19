import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import IntervalTrainerIcon from './interval-trainer-icon.js';
import IntervalTrainerDisplay from './interval-trainer-display.js';

export default class IntervalTrainerInfo {
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

  getDisplayComponent() {
    return IntervalTrainerDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./interval-trainer-editor.js')).default;
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

  redactContent(content) {
    return cloneDeep(content);
  }

  getCdnResources() {
    return [];
  }
}
