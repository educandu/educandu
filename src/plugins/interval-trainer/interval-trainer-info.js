import joi from 'joi';
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

  validateContent(content) {
    const schema = joi.object({
      title: joi.string().allow('').required(),
      keyboardShortcuts: joi.string().allow('').required(),
      keyboardStart: joi.number().min(0).required(),
      keyboardEnd: joi.number().min(0).required(),
      keyboardOffset: joi.number().min(0).required(),
      tests: joi.array().items(joi.object({
        question: joi.string().allow('').required(),
        interval: joi.array().items(joi.number().min(0)).required()
      })).required()
    });

    joi.attempt(content, schema, { convert: false, noDefaults: true });
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
