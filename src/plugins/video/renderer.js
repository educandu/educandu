import VideoDisplay from './display/video-display';

class Video {
  static get typeName() { return 'video'; }

  getDisplayComponent() {
    return VideoDisplay;
  }
}

export default Video;
