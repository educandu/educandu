import AudioDisplay from './display/audio-display';

class Audio {
  static get typeName() { return 'audio'; }

  getDisplayComponent() {
    return AudioDisplay;
  }
}

export default Audio;
