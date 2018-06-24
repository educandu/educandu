const H5pPlayerDisplay = require('./display/h5p-player-display.jsx');

class H5pPlayer {
  static get typeName() { return 'h5p-player'; }

  getDisplayComponent() {
    return H5pPlayerDisplay;
  }
}

module.exports = H5pPlayer;
