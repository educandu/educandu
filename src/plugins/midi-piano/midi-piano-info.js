import React from 'react';
import cloneDeep from '../../utils/clone-deep.js';
import MidiPianoDisplay from './midi-piano-display.js';
import { QuestionCircleOutlined } from '@ant-design/icons';

class MidiPianoInfo {

  static get typeName() { return 'midi-piano'; }

  constructor(gfm) {
    this.gfm = gfm;
    this.type = 'midi-piano';
  }

  getName(t) {
    return t('midiPiano:name');
  }

  getIcon() {
    return <QuestionCircleOutlined />;
  }

  getDisplayComponent() {
    return MidiPianoDisplay;
  }

  async resolveEditorComponent() {
    return (await import('./midi-piano-editor.js')).default;
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

export default MidiPianoInfo;
