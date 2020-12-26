import VideoEditor from './editing/video-editor';

class Video {
  static get typeName() { return 'video'; }

  getEditorComponent() {
    return VideoEditor;
  }
}

export default Video;
