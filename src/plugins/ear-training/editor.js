import EarTrainingEditor from './editing/ear-training-editor';

class EarTraining {
  static get typeName() { return 'ear-training'; }

  getEditorComponent() {
    return EarTrainingEditor;
  }
}

export default EarTraining;
