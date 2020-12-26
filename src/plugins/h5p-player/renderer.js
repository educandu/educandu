import H5pPlayerDisplay from './display/h5p-player-display';

class H5pPlayer {
  static get typeName() { return 'h5p-player'; }

  getDisplayComponent() {
    return H5pPlayerDisplay;
  }
}

export default H5pPlayer;
