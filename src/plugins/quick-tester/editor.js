const QuickTesterEditor = require('./editing/quick-tester-editor');

class QuickTester {
  static get typeName() { return 'quick-tester'; }

  getEditorComponent() {
    return QuickTesterEditor;
  }
}

module.exports = QuickTester;
