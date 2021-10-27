import AbcNotationEditor from './editing/abc-notation-editor.js';

class AbcNotation {
  static get typeName() { return 'abc-notation'; }

  getEditorComponent() {
    return AbcNotationEditor;
  }
}

export default AbcNotation;
