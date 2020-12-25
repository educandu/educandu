const IntervalTrainerDisplay = require('./display/interval-trainer-display');

class IntervalTrainer {
  static get typeName() { return 'interval-trainer'; }

  getDisplayComponent() {
    return IntervalTrainerDisplay;
  }
}

module.exports = IntervalTrainer;
