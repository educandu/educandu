const AnavisDisplay = require('./display/anavis-display');

class Anavis {
  static get typeName() { return 'anavis'; }

  getDisplayComponent() {
    return AnavisDisplay;
  }
}

module.exports = Anavis;
