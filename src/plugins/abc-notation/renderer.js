const AbcNotationDisplay = require('./display/abc-notation-display.jsx');

class AbcNotation {
  static get typeName() { return 'abc-notation'; }

  getDisplayComponent() {
    return AbcNotationDisplay;
  }
}

module.exports = AbcNotation;
