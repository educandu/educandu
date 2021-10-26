import AnnotationDisplay from './display/annotation-display.js';

class Annotation {
  static get typeName() { return 'annotation'; }

  getDisplayComponent() {
    return AnnotationDisplay;
  }
}

export default Annotation;
