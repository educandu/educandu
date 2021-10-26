import AudioDisplay from './display/audio-display.js';

class Audio {
  static get typeName() { return 'audio'; }

  getDisplayComponent() {
    return AudioDisplay;
  }
}

export default Audio;
