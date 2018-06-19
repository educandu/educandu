const AudioEditor = require('./editing/audio-editor.jsx');

class Audio {
  static get typeName() { return 'audio'; }

  getEditorComponent() {
    return AudioEditor;
  }
}

module.exports = Audio;
