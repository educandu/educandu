const AbcNotationEditor = require('./editing/abc-notation-editor');

class AbcNotation {
  static get typeName() { return 'abc-notation'; }

  getEditorComponent() {
    return AbcNotationEditor;
  }
}

module.exports = AbcNotation;
