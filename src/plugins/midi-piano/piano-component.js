import React, { useRef, useEffect } from 'react';
import { Button } from 'antd';
import { Piano } from 'react-piano';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import * as Tone from 'tone';
import { midiValueToName } from './soundmap.js';

export default function PianoComponent({ content }) {

  const sampler = useRef(null);
  // const samplerArray = useRef([]);
  const samplerHasLoaded = useRef(false);

  useEffect(() => {
    sampler.current = new Tone.Sampler({
      urls: {
        'A0': 'A0.mp3',
        'C1': 'C1.mp3',
        'D#1': 'Ds1.mp3',
        'F#1': 'Fs1.mp3',
        'A1': 'A1.mp3',
        'C2': 'C2.mp3',
        'D#2': 'Ds2.mp3',
        'F#2': 'Fs2.mp3',
        'A2': 'A2.mp3',
        'C3': 'C3.mp3',
        'D#3': 'Ds3.mp3',
        'F#3': 'Fs3.mp3',
        'A3': 'A3.mp3',
        'C4': 'C4.mp3',
        'D#4': 'Ds4.mp3',
        'F#4': 'Fs4.mp3',
        'A4': 'A4.mp3',
        'C5': 'C5.mp3',
        'D#5': 'Ds5.mp3',
        'F#5': 'Fs5.mp3',
        'A5': 'A5.mp3',
        'C6': 'C6.mp3',
        'D#6': 'Ds6.mp3',
        'F#6': 'Fs6.mp3',
        'A6': 'A6.mp3',
        'C7': 'C7.mp3',
        'D#7': 'Ds7.mp3',
        'F#7': 'Fs7.mp3',
        'A7': 'A7.mp3',
        'C8': 'C8.mp3'
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/'
    }).toDestination();
    // samplerArray.current.push(sampler);
    if (!samplerHasLoaded.curent) {
      setTimeout(() => {
        samplerHasLoaded.current = true;
      }, 2000);
    }
  });

  const handleButtonClick = () => {
    sampler.current.triggerAttackRelease('A4', '8n');
  };

  const playNote = midiNumber => {
    if (!samplerHasLoaded.current) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log(samplerHasLoaded.current);
    sampler.current.triggerAttack(midiValueToName[midiNumber]);
  };

  const stopNote = midiNumber => {
    sampler.current.triggerRelease(midiValueToName[midiNumber]);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ paddingTop: '1rem', width: '100%', aspectRatio: '6/1' }}>
        <Button onClick={handleButtonClick}>Ton abspielen</Button>
        <Piano
          noteRange={{ first: content.firstNote, last: content.lastNote }}
          playNote={playNote}
          stopNote={stopNote}
          />
      </div>
    </div>
  );
}

PianoComponent.propTypes = {
  ...sectionDisplayProps
};
