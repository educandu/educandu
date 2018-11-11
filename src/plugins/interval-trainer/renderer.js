const IntervalTrainerDisplay = require('./display/interval-trainer-display.jsx');

class IntervalTrainer {
  static get typeName() { return 'interval-trainer'; }

  getDisplayComponent() {
    return IntervalTrainerDisplay;
  }
}

module.exports = IntervalTrainer;
