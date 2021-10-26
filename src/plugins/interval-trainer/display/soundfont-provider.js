// See https://github.com/danigb/soundfont-player
// for more documentation on prop options.

import React from 'react';
import autoBind from 'auto-bind';
import PropTypes from 'prop-types';
import Soundfont from 'soundfont-player';
import AudioContextProvider from '../../../common/audio-context-provider.js';

class SoundfontProvider extends React.Component {
  constructor(props) {
    super(props);
    autoBind(this);
    this.canReceiveInstrument = false;
    this.state = {
      activeAudioNodes: {},
      instrument: null
    };
  }

  componentDidMount() {
    this.canReceiveInstrument = true;
    this.loadInstrument(this.props.instrumentName);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.instrumentName !== this.props.instrumentName) {
      this.loadInstrument(this.props.instrumentName);
    }
  }

  componentWillUnmount() {
    this.canReceiveInstrument = false;
  }

  async loadInstrument(instrumentName) {
    // Re-trigger loading state
    this.setState({ instrument: null });
    const instrument = await Soundfont.instrument(this.props.audioContext, instrumentName, {
      format: this.props.format,
      soundfont: this.props.soundfont,
      nameToUrl: (name, soundfont, format) => `${this.props.hostname}/${soundfont}/${name}-${format}.js`
    });
    if (this.canReceiveInstrument) {
      this.setState({ instrument });
    }
  }

  async playNote(midiNumber) {
    await this.props.audioContext.resume();
    const audioNode = this.state.instrument.play(midiNumber);
    this.setState(prevState => ({
      activeAudioNodes: {
        ...prevState.activeAudioNodes,
        [midiNumber]: audioNode
      }
    }));
  }

  async stopNote(midiNumber) {
    await this.props.audioContext.resume();
    if (!this.state.activeAudioNodes[midiNumber]) {
      return;
    }
    const audioNode = this.state.activeAudioNodes[midiNumber];
    audioNode.stop();
    this.setState(prevState => ({
      activeAudioNodes: {
        ...prevState.activeAudioNodes,
        [midiNumber]: null
      }
    }));
  }

  // Clear any residual notes that don't get called with stopNote
  async stopAllNotes() {
    await this.props.audioContext.resume();
    const activeAudioNodes = Object.values(this.state.activeAudioNodes);
    activeAudioNodes.forEach(node => {
      if (node) {
        node.stop();
      }
    });
    this.setState({
      activeAudioNodes: {}
    });
  }

  render() {
    return this.props.render({
      isLoading: !this.state.instrument,
      playNote: this.playNote,
      stopNote: this.stopNote,
      stopAllNotes: this.stopAllNotes
    });
  }
}

SoundfontProvider.propTypes = {
  audioContext: PropTypes.instanceOf(AudioContextProvider.getAudioContextConstructor()).isRequired,
  format: PropTypes.oneOf(['mp3', 'ogg']),
  hostname: PropTypes.string.isRequired,
  instrumentName: PropTypes.string,
  render: PropTypes.func,
  soundfont: PropTypes.oneOf(['MusyngKite', 'FluidR3_GM'])
};

SoundfontProvider.defaultProps = {
  format: 'mp3',
  instrumentName: 'acoustic_grand_piano',
  render: () => null,
  soundfont: 'MusyngKite'
};

export default SoundfontProvider;
