const AnnotationEditor = require('./editing/annotation-editor');

class Annotation {
  static get typeName() { return 'annotation'; }

  getEditorComponent() {
    return AnnotationEditor;
  }
}

module.exports = Annotation;
