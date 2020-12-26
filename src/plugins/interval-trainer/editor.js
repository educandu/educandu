import IntervalTrainerEditor from './editing/interval-trainer-editor';

class IntervalTrainer {
  static get typeName() { return 'interval-trainer'; }

  getEditorComponent() {
    return IntervalTrainerEditor;
  }
}

export default IntervalTrainer;
