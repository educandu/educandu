import AnavisDisplay from './display/anavis-display';

class Anavis {
  static get typeName() { return 'anavis'; }

  getDisplayComponent() {
    return AnavisDisplay;
  }
}

export default Anavis;
