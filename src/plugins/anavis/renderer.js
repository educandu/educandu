import AnavisDisplay from './display/anavis-display.js';

class Anavis {
  static get typeName() { return 'anavis'; }

  getDisplayComponent() {
    return AnavisDisplay;
  }
}

export default Anavis;
