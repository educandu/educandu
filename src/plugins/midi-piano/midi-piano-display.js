import axios from 'axios';
import * as Tone from 'tone';
import { Button } from 'antd';
import { Piano } from 'react-piano';
import midiPlayerNs from 'midi-player-js';
import urlUtils from '../../utils/url-utils.js';
import React, { useEffect, useRef } from 'react';
import { QuestionCircleOutlined } from '@ant-design/icons';
import ClientConfig from '../../bootstrap/client-config.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PlayIcon from '../../components/icons/media-player/play-icon.js';
import PauseIcon from '../../components/icons/media-player/pause-icon.js';

export default function MidiPianoDisplay({ content }) {

  const sampler = useRef(null);
  const player = useRef(null);
  const samplerHasLoaded = useRef(false); // Set to true after 2 seconds. Needs to be set to true when the buffer is loaded.
  const midiData = useRef(null);
  const { sourceType, sourceUrl, midiTrackTitle } = content;
  const clientConfig = useService(ClientConfig);
  const src = urlUtils.getMidiUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl });
  const hasMidiFile = sourceUrl !== '';
  const hasMidiTrackTitle = midiTrackTitle !== '';
  const { NOTES } = midiPlayerNs.Constants;
  const midiAccessObj = useRef(null);

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

  function handleSamplerEvent(eventType, noteName, velocity, midiValue) {
    switch (eventType) {
      case 'Note on':
        if (velocity > 0) {
          sampler.current.triggerAttack(noteName);
          break;
        }
        sampler.current.triggerRelease(noteName);
        break;
      case 'Note off':
        sampler.current.triggerRelease(noteName);
        break;
      default:
        break;
    }
  }

  function handleMidiDeviceEvent(message) {
    const noteName = getNoteNameFromMidiValue(message.data[1]);
    const velocity = message.data.length > 2 ? message.data[2] : 0;
    const command = message.data[0];
    const eventType = getEventTypefromMidiCommand(command, velocity);
    const midiValue = message.data[1];

    // eslint-disable-next-line no-console
    console.log(message);
    handleSamplerEvent(eventType, noteName, velocity, midiValue);
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

  navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

  function handleMidiPlayerEvent(message) {

    // eslint-disable-next-line no-console
    console.log(message);
    const eventType = message.name;
    if (eventType !== 'Note on' && eventType !== 'Note off') {
      return;
    }
    const noteName = message.noteName;
    const velocity = message.velocity;
    const midiValue = message.noteNumber;

    handleSamplerEvent(eventType, noteName, velocity, midiValue);
  }

  function instantiatePlayer() {
    if (player.current) {
      // eslint-disable-next-line no-console
      console.log('return from instantiating player');
      return;
    }
    // eslint-disable-next-line no-console
    console.log('instantiating player');
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
    player.current.pause();
    sampler.current.releaseAll();
  };

  const stopMidiPlayer = () => {
    player.current.stop();
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
    if (sampler.current) {
      // eslint-disable-next-line no-console
      console.log('return from instantiating sampler');
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
      baseUrl: 'https://tonejs.github.io/audio/salamander/' // Samples better be hosted in project.
    }).toDestination();

    if (!samplerHasLoaded.current) {
      setTimeout(() => {
        samplerHasLoaded.current = true;
      }, 2000);
    }
  });

  useEffect(() => {
    if (!src) {
      return;
    }
    getData();
  }, []);

  useEffect(() => {
    return function cleanup() {
      if (player.current !== null && player.current.isPlaying) {
        stopMidiPlayer();
      }
      for (const input of midiAccessObj.current.inputs.values()) {
        input.onmidimessage = null;
      }
    };
  });

  return (
    <React.Fragment>
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ paddingTop: '1rem', width: '100%', aspectRatio: '6/1' }}>
          <Piano
            noteRange={{ first: content.firstNote, last: content.lastNote }}
            playNote={playNote}
            stopNote={stopNote}
            />
        </div>
      </div>
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
