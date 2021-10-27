import AnnotationEditor from './editing/annotation-editor.js';

class Annotation {
  static get typeName() { return 'annotation'; }

  getEditorComponent() {
    return AnnotationEditor;
  }
}

export default Annotation;
