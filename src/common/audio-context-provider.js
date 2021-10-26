import { isBrowser } from '../ui/browser-helper.js';

class FakeAudioContext {}

const AudioContextConstructor = isBrowser() ? window.AudioContext : FakeAudioContext;

let audioContext = null;

class AudioContextProvider {
  getAudioContext() {
    if (!audioContext) {
      audioContext = new AudioContextConstructor();
    }

    return audioContext;
  }

  static getAudioContextConstructor() {
    return AudioContextConstructor;
  }
}

export default AudioContextProvider;
