const CreditDisplay = require('./display/credit-display.jsx');

class Credit {
  static get typeName() { return 'credit'; }

  getDisplayComponent() {
    return CreditDisplay;
  }
}

module.exports = Credit;
