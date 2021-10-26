import VideoDisplay from './display/video-display.js';

class Video {
  static get typeName() { return 'video'; }

  getDisplayComponent() {
    return VideoDisplay;
  }
}

export default Video;
