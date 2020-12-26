import AnnotationDisplay from './display/annotation-display';

class Annotation {
  static get typeName() { return 'annotation'; }

  getDisplayComponent() {
    return AnnotationDisplay;
  }
}

export default Annotation;
