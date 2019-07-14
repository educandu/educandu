const AbcNotationEditor = require('./editing/abc-notation-editor.jsx');

class AbcNotation {
  static get typeName() { return 'abc-notation'; }

  getEditorComponent() {
    return AbcNotationEditor;
  }
}

module.exports = AbcNotation;
