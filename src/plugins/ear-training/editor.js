const EarTrainingEditor = require('./editing/ear-training-editor');

class EarTraining {
  static get typeName() { return 'ear-training'; }

  getEditorComponent() {
    return EarTrainingEditor;
  }
}

module.exports = EarTraining;
