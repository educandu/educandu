const QuickTesterDisplay = require('./display/quick-tester-display.jsx');

class QuickTester {
  static get typeName() { return 'quick-tester'; }

  getDisplayComponent() {
    return QuickTesterDisplay;
  }
}

module.exports = QuickTester;
