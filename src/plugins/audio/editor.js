import AudioEditor from './editing/audio-editor.js';

class Audio {
  static get typeName() { return 'audio'; }

  getEditorComponent() {
    return AudioEditor;
  }
}

export default Audio;
