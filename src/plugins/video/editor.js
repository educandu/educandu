const VideoEditor = require('./editing/video-editor.jsx');

class Video {
  static get typeName() { return 'video'; }

  getEditorComponent() {
    return VideoEditor;
  }
}

module.exports = Video;
