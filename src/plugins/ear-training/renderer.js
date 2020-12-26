import EarTrainingDisplay from './display/ear-training-display';

class EarTraining {
  static get typeName() { return 'ear-training'; }

  getDisplayComponent() {
    return EarTrainingDisplay;
  }
}

export default EarTraining;
