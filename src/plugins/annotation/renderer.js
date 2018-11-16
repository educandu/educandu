const AnnotationDisplay = require('./display/annotation-display.jsx');

class Annotation {
  static get typeName() { return 'annotation'; }

  getDisplayComponent() {
    return AnnotationDisplay;
  }
}

module.exports = Annotation;
