import AnavisEditor from './editing/anavis-editor.js';

class Anavis {
  static get typeName() { return 'anavis'; }

  getEditorComponent() {
    return AnavisEditor;
  }
}

export default Anavis;
