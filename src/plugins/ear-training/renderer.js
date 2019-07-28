const EarTrainingDisplay = require('./display/ear-training-display.jsx');

class EarTraining {
  static get typeName() { return 'ear-training'; }

  getDisplayComponent() {
    return EarTrainingDisplay;
  }
}

module.exports = EarTraining;
