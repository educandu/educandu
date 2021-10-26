import QuickTesterEditor from './editing/quick-tester-editor.js';

class QuickTester {
  static get typeName() { return 'quick-tester'; }

  getEditorComponent() {
    return QuickTesterEditor;
  }
}

export default QuickTester;
