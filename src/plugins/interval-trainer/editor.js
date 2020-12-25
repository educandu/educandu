const IntervalTrainerEditor = require('./editing/interval-trainer-editor');

class IntervalTrainer {
  static get typeName() { return 'interval-trainer'; }

  getEditorComponent() {
    return IntervalTrainerEditor;
  }
}

module.exports = IntervalTrainer;
