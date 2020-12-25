const VideoEditor = require('./editing/video-editor');

class Video {
  static get typeName() { return 'video'; }

  getEditorComponent() {
    return VideoEditor;
  }
}

module.exports = Video;
