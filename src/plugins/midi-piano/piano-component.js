import React, { useState, useRef, useEffect } from 'react';
import { Piano } from 'react-piano';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import * as Tone from 'tone';
import { midiValueToName } from './soundmap.js';
import MidiPlayer from './midiplayer.js';
// import { midiDemos } from './mididemos.js';
import { Button } from 'antd';
import axios from 'axios';
import urlUtils from '../../utils/url-utils.js';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';

export default function PianoComponent({ content }) {

  const sampler = useRef(null);
  const player = useRef(null);
  const samplerHasLoaded = useRef(false); // Set to true after 2 seconds. Needs to be set to true when the buffer is loaded.
  const midiData = useRef(null);
  const isPlaying = useRef(false);

  const { sourceType, sourceUrl } = content;
  const clientConfig = useService(ClientConfig);
  const src = urlUtils.getMidiUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl });

  // eslint-disable-next-line no-console
  console.log(src);

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

    if (!samplerHasLoaded.current) {
      setTimeout(() => {
        samplerHasLoaded.current = true;
      }, 2000);
    }
  });

  function handleMidiEvent(message) {
    const noteName = message.noteName;
    const velocity = message.velocity;
    const eventType = velocity > 0 ? 'noteOn' : 'noteOff';

    switch (eventType) {
      case 'noteOn':
        sampler.current.triggerAttack(noteName);
        break;
      case 'noteOff':
        sampler.current.triggerRelease(noteName);
        break;
      default:
        break;
    }
  }

  function instantiatePlayer() {

    if (player.current === null) {
      player.current = new MidiPlayer.Player();
    }

    player.current.on('midiEvent', message => {
      handleMidiEvent(message);
    });
    player.current.on('playing', () => {
      // eslint-disable-next-line no-console
      // console.log('playing');
    });
    player.current.on('endOfFile', () => {
      player.current.stop();
      isPlaying.current = false;
    });
    player.current.loadArrayBuffer(midiData.current);
  }

  function playMidiDemo(array) {
    if (player.current !== null && isPlaying.current) {
      return;
    }
    midiData.current = array;
    if (player.current === null) {
      instantiatePlayer();
    }
    window.setTimeout(() => {
      player.current.play();
      isPlaying.current = true;
    }, 1000);
  }

  // function loadOnDrop(event) {
  //   reader = new FileReader();
  //   reader.onload = () => {
  //     midiData = new Uint8Array(reader.result);
  //     instantiatePlayer();
  //     window.setTimeout(() => {
  //       player.play();
  //     }, 500);
  //   };
  //   const file = event.dataTransfer.files[0];
  //   reader.readAsArrayBuffer(file);
  // }

  const playNote = midiNumber => {
    if (!samplerHasLoaded.current) {
      return;
    }
    sampler.current.triggerAttack(midiValueToName[midiNumber]);
  };

  const stopNote = midiNumber => {
    sampler.current.triggerRelease(midiValueToName[midiNumber]);
  };

  const getData = () => {
    axios.get(src, { responseType: 'arraybuffer' })
      .then(response => {
        midiData.current = new Uint8Array(response.data);
      })
      // eslint-disable-next-line no-console
      .catch(error => console.log(error));
  };

  useEffect(() => {
    if (!src) {
      return;
    }
    getData();
  }, []);

  return (
    <React.Fragment>
      {/* <Button onClick={handleButtonClick}>Hallo</Button> */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ paddingTop: '1rem', width: '100%', aspectRatio: '6/1' }}>
          <Piano
            noteRange={{ first: content.firstNote, last: content.lastNote }}
            playNote={playNote}
            stopNote={stopNote}
            />
        </div>
      </div>
    </React.Fragment>
  );
}

PianoComponent.propTypes = {
  ...sectionDisplayProps
};
