const AudioEditor = require('./editing/audio-editor');

class Audio {
  static get typeName() { return 'audio'; }

  getEditorComponent() {
    return AudioEditor;
  }
}

module.exports = Audio;
