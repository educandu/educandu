import AbcNotationEditor from './editing/abc-notation-editor';

class AbcNotation {
  static get typeName() { return 'abc-notation'; }

  getEditorComponent() {
    return AbcNotationEditor;
  }
}

export default AbcNotation;
