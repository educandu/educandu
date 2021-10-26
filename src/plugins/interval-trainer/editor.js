import IntervalTrainerEditor from './editing/interval-trainer-editor.js';

class IntervalTrainer {
  static get typeName() { return 'interval-trainer'; }

  getEditorComponent() {
    return IntervalTrainerEditor;
  }
}

export default IntervalTrainer;
