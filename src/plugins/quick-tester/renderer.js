import QuickTesterDisplay from './display/quick-tester-display';

class QuickTester {
  static get typeName() { return 'quick-tester'; }

  getDisplayComponent() {
    return QuickTesterDisplay;
  }
}

export default QuickTester;
