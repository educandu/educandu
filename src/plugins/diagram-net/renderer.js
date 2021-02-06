import DiagramNetDisplay from './display/diagram-net-display';

class DiagramNet {
  static get typeName() { return 'diagram-net'; }

  getDisplayComponent() {
    return DiagramNetDisplay;
  }
}

export default DiagramNet;
