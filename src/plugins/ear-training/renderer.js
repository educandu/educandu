import EarTrainingDisplay from './display/ear-training-display.js';

class EarTraining {
  static get typeName() { return 'ear-training'; }

  getDisplayComponent() {
    return EarTrainingDisplay;
  }
}

export default EarTraining;
