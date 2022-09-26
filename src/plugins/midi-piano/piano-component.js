import React from 'react';
import { Piano } from 'react-piano';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import SoundfontProvider from '../interval-trainer/soundfont-provider.js';
import AudioContextProvider from '../../common/audio-context-provider.js';
import { useService } from '../../components/container-context.js';

export default function PianoComponent({ content }) {

  // CCCCCC
  // const playNote = midiNumber => {
  //   // eslint-disable-next-line no-console
  //   console.log('play', midiNumber);
  // };

  // const stopNote = midinumber => {
  //   // eslint-disable-next-line no-console
  //   console.log('stop', midinumber);
  // };

  const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';

  const audioContextProvider = useService(AudioContextProvider);
  const audioContext = audioContextProvider.getAudioContext();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ paddingTop: '1rem', width: '100%', aspectRatio: '6/1' }}>
        <SoundfontProvider
          instrumentName="acoustic_grand_piano"
          audioContext={audioContext}
          hostname={soundfontHostname}
          offset={content.keyboardOffset || 0}
          render={({ playNote, stopNote }) => (
            <Piano
              noteRange={{ first: content.firstNote, last: content.lastNote }}
              playNote={playNote}
              stopNote={stopNote}
              />
          )}
          />
      </div>
    </div>
  );
}

PianoComponent.propTypes = {
  ...sectionDisplayProps
};
