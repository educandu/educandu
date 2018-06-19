const AudioDisplay = require('./display/audio-display.jsx');

class Audio {
  static get typeName() { return 'audio'; }

  getDisplayComponent() {
    return AudioDisplay;
  }
}

module.exports = Audio;
