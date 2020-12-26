import H5pPlayerEditor from './editing/h5p-player-editor';

class H5pPlayer {
  static get typeName() { return 'h5p-player'; }

  getEditorComponent() {
    return H5pPlayerEditor;
  }
}

export default H5pPlayer;
