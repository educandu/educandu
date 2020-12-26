import AudioEditor from './editing/audio-editor';

class Audio {
  static get typeName() { return 'audio'; }

  getEditorComponent() {
    return AudioEditor;
  }
}

export default Audio;
