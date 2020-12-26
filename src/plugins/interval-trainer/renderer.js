import IntervalTrainerDisplay from './display/interval-trainer-display';

class IntervalTrainer {
  static get typeName() { return 'interval-trainer'; }

  getDisplayComponent() {
    return IntervalTrainerDisplay;
  }
}

export default IntervalTrainer;
