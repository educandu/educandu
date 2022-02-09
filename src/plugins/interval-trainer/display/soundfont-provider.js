// See https://github.com/danigb/soundfont-player
// for more documentation on prop options.

import PropTypes from 'prop-types';
import Soundfont from 'soundfont-player';
import { useEffect, useState } from 'react';
import AudioContextProvider from '../../../common/audio-context-provider.js';

function SoundfontProvider({ format, soundfont, instrumentName, hostname, audioContext, render }) {
  const [instrument, setInstrument] = useState(null);
  const [activeAudioNodes, setActiveAudioNodes] = useState({});

  useEffect(() => {
    (async () => {
      // Re-trigger loading state
      setInstrument(null);
      const soundfontInstrument = await Soundfont.instrument(audioContext, instrumentName, {
        format,
        soundfont,
        nameToUrl: (name, currentSoundfont, currentFormat) => `${hostname}/${currentSoundfont}/${name}-${currentFormat}.js`
      });
      setInstrument(soundfontInstrument);
    })();
  }, [format, soundfont, hostname, instrumentName, audioContext]);

  const playNote = async midiNumber => {
    await audioContext.resume();
    const audioNode = instrument.play(midiNumber);
    setActiveAudioNodes(prevState => ({
      ...prevState,
      [midiNumber]: audioNode
    }));
  };

  const stopNote = async midiNumber => {
    await audioContext.resume();
    if (!activeAudioNodes[midiNumber]) {
      return;
    }
    const audioNode = activeAudioNodes[midiNumber];
    audioNode.stop();
    setActiveAudioNodes(prevState => ({
      ...prevState,
      [midiNumber]: null
    }));
  };

  // Clear any residual notes that don't get called with stopNote
  const stopAllNotes = async () => {
    await audioContext.resume();
    Object.values(activeAudioNodes).forEach(node => {
      if (node) {
        node.stop();
      }
    });
    setActiveAudioNodes({});
  };

  return render({
    isLoading: !instrument,
    playNote,
    stopNote,
    stopAllNotes
  });
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
