import axios from 'axios';
import * as Tone from 'tone';
import { Button } from 'antd';
import midiPlayerNs from 'midi-player-js';
import urlUtils from '../../utils/url-utils.js';
import React, { useEffect, useRef } from 'react';
import PianoComponent from './piano-component.js';
import { QuestionCircleOutlined } from '@ant-design/icons';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PlayIcon from '../../components/icons/media-player/play-icon.js';
import PauseIcon from '../../components/icons/media-player/pause-icon.js';

export default function MidiPianoDisplay({ content }) {

  const keys = useRef([]);
  const player = useRef(null);
  const sampler = useRef(null);
  const midiData = useRef(null);
  const midiAccessObj = useRef(null);
  const samplerHasLoaded = useRef(false);
  const { NOTES } = midiPlayerNs.Constants;
  const { sourceType, sourceUrl, midiTrackTitle, noteRange } = content;
  const hasMidiFile = sourceUrl !== '';
  const hasMidiTrackTitle = midiTrackTitle !== '';
  const clientConfig = useService(ClientConfig);
  const src = urlUtils.getMidiUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl });

  const getNoteNameFromMidiValue = midiValue => {
    return NOTES[midiValue];
  };

  const getEventTypefromMidiCommand = (command, velocity) => {
    switch (command) {
      case 144:
        if (velocity > 0) {
          return 'Note on';
        }
        return 'Note off';
      case 128:
        return 'Note off';
      case 176:
        return 'Sustain off';
      default:
        return '';
    }
  };

  function handleSamplerEvent(eventType, noteName) {
    switch (eventType) {
      case 'Note on':
        sampler.current.triggerAttack(noteName);
        break;
      case 'Note off':
        sampler.current.triggerRelease(noteName);
        break;
      default:
        break;
    }
  }

  function updateKeyVisualization(eventType, midiValue) {
    if (!keys.current[midiValue]) {
      return;
    }
    if (eventType === 'Note on') {
      keys.current[midiValue].classList.add('ReactPiano__Key--active');
      return;
    }
    if (eventType === 'Note off') {
      keys.current[midiValue].classList.remove('ReactPiano__Key--active');
    }
  }

  function handleMidiDeviceEvent(message) {
    const noteName = getNoteNameFromMidiValue(message.data[1]);
    const velocity = message.data.length > 2 ? message.data[2] : 0;
    const command = message.data[0];
    const eventType = getEventTypefromMidiCommand(command, velocity);
    const midiValue = message.data[1];
    updateKeyVisualization(eventType, midiValue);
    handleSamplerEvent(eventType, noteName);
  }

  function onMIDISuccess(midiAccess) {
    midiAccessObj.current = midiAccess;
    for (const input of midiAccessObj.current.inputs.values()) {
      input.onmidimessage = handleMidiDeviceEvent;
    }
  }

  function onMIDIFailure() {
    // eslint-disable-next-line no-console
    console.log('Could not access your MIDI devices.');
  }

  function handleMidiPlayerEvent(message) {

    const velocity = message.velocity;
    if (message.name !== 'Note on' && message.name !== 'Note off') {
      return;
    }
    const eventType = velocity > 0 ? 'Note on' : 'Note off';
    const noteName = message.noteName;
    const midiValue = message.noteNumber;
    updateKeyVisualization(eventType, midiValue);
    handleSamplerEvent(eventType, noteName);
  }

  function instantiatePlayer() {
    if (player.current) {
      return;
    }
    player.current = new midiPlayerNs.Player();
    player.current.on('midiEvent', message => {
      handleMidiPlayerEvent(message);
    });
    player.current.on('playing', () => {

    });
    player.current.on('endOfFile', () => {
      player.current.stop();
    });
    player.current.loadArrayBuffer(midiData.current);
  }

  const removeActiveClassFromKeys = () => {
    for (const key of keys.current) {
      if (key && key.classList.contains('ReactPiano__Key--active')) {
        key.classList.remove('ReactPiano__Key--active');
      }
    }
  };

  const startMidiPlayer = () => {

    if (player.current !== null && player.current.isPlaying()) {
      return;
    }
    if (player.current === null) {
      instantiatePlayer();
      player.current.play();
      return;
    }
    player.current.play();
  };

  const pauseMidiPlayer = () => {
    if (!player.current.isPlaying()) {
      return;
    }
    player.current.pause();
    removeActiveClassFromKeys();
    sampler.current.releaseAll();
  };

  const stopMidiPlayer = () => {
    player.current.stop();
    removeActiveClassFromKeys();
    sampler.current.releaseAll();
  };

  const playNote = midiValue => {
    if (!samplerHasLoaded.current) {
      return;
    }
    sampler.current.triggerAttack(getNoteNameFromMidiValue(midiValue));
  };

  const stopNote = midiValue => {
    setTimeout(() => {
      sampler.current.triggerRelease(getNoteNameFromMidiValue(midiValue));
    }, 200);
  };

  const getData = () => {
    try {
      axios.get(src, { responseType: 'arraybuffer' })
        .then(response => {
          midiData.current = response.data;
        });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };

  const renderControls = () => (
    <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '1rem' }}>
      <Button onClick={startMidiPlayer} icon={<PlayIcon />} />
      <Button onClick={pauseMidiPlayer} icon={<PauseIcon />} />
      <Button onClick={stopMidiPlayer} icon={<QuestionCircleOutlined />} />
    </div>
  );

  const renderMidiTrackTitle = () => (
    <div style={{ display: 'flex', justifyContent: 'center' }}>{midiTrackTitle}</div>
  );

  useEffect(() => {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  });

  useEffect(() => {
    if (sampler.current) {
      return;
    }
    // eslint-disable-next-line no-console
    console.log('instantiating sampler');
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
      onload: () => {
        samplerHasLoaded.current = true;
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/' // Samples better be hosted in project.
    }).toDestination();
  });

  useEffect(() => {
    if (!src) {
      return;
    }
    getData();
  }, []);

  useEffect(() => {
    return function cleanup() {
      if (!midiAccessObj.current) {
        return;
      }
      if (player.current !== null && player.current.isPlaying()) {
        stopMidiPlayer();
      }
      for (const input of midiAccessObj.current.inputs.values()) {
        input.onmidimessage = null;
      }
    };
  });

  return (
    <React.Fragment>
      <PianoComponent
        noteRange={noteRange}
        playNote={playNote}
        stopNote={stopNote}
        keys={keys}
        />
      <div style={{ paddingTop: '1.5rem' }}>
        {hasMidiFile
          && renderControls()}
        {hasMidiTrackTitle && hasMidiFile
          && renderMidiTrackTitle()}
      </div>
    </React.Fragment>
  );
}

MidiPianoDisplay.propTypes = {
  ...sectionDisplayProps
};
