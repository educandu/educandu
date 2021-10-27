import VideoEditor from './editing/video-editor.js';

class Video {
  static get typeName() { return 'video'; }

  getEditorComponent() {
    return VideoEditor;
  }
}

export default Video;
