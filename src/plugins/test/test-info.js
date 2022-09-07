import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import TestDisplay from './test-display.js';
import { QuestionCircleOutlined } from '@ant-design/icons';

class TestInfo {

  static get typeName() { return 'test'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'test';
  }

  getName(t) {
    return t('test:name');
  }

  getIcon() {
    return <QuestionCircleOutlined />;
  }

  getDisplayComponent() {
    return TestDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./test-editor.js')).default;
  }

  getDefaultContent() {
    return {
      text: 'default text',
      firstNote: 48,
      lastNote: 84
    };
  }

  cloneContent(content) {
    return cloneDeep(content);
  }

  redactContent(content, targetRoomId) {
    const redactedContent = cloneDeep(content);

    return redactedContent;
  }

  getCdnResources(content) {
    return [];
  }
}

export default TestInfo;
