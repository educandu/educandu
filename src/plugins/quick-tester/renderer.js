const QuickTesterDisplay = require('./display/quick-tester-display');

class QuickTester {
  static get typeName() { return 'quick-tester'; }

  getDisplayComponent() {
    return QuickTesterDisplay;
  }
}

module.exports = QuickTester;
