const CreditEditor = require('./editing/credit-editor.jsx');

class Credit {
  static get typeName() { return 'credit'; }

  getEditorComponent() {
    return CreditEditor;
  }
}

module.exports = Credit;
