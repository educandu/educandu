import AbcNotationDisplay from './display/abc-notation-display.js';

class AbcNotation {
  static get typeName() { return 'abc-notation'; }

  getDisplayComponent() {
    return AbcNotationDisplay;
  }
}

export default AbcNotation;
