import QuickTesterEditor from './editing/quick-tester-editor';

class QuickTester {
  static get typeName() { return 'quick-tester'; }

  getEditorComponent() {
    return QuickTesterEditor;
  }
}

export default QuickTester;
