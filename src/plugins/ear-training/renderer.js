const EarTrainingDisplay = require('./display/ear-training-display');

class EarTraining {
  static get typeName() { return 'ear-training'; }

  getDisplayComponent() {
    return EarTrainingDisplay;
  }
}

module.exports = EarTraining;
