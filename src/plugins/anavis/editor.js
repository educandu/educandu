const AnavisEditor = require('./editing/anavis-editor');

class Anavis {
  static get typeName() { return 'anavis'; }

  getEditorComponent() {
    return AnavisEditor;
  }
}

module.exports = Anavis;
