import AnavisEditor from './editing/anavis-editor';

class Anavis {
  static get typeName() { return 'anavis'; }

  getEditorComponent() {
    return AnavisEditor;
  }
}

export default Anavis;
