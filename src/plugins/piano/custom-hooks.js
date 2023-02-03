import * as ut from './utils.js';
import * as C from './constants.js';
import HttpClient from '../../api-clients/http-client.js';
import { create as createId } from '../../utils/unique-id.js';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';

/**
 * This hook uses the Web MIDI API for checking if a MIDI device is connected.
 * If true, stores the Midi Acces Object on browser document object to be accessed by each piano on the page.
 */
export function useMidiDevice() {
  const [isMidiDeviceConnected, setIsMidiDeviceConnected] = useState(false);

  useEffect(() => {
    if (isMidiDeviceConnected) {
      return;
    }
    if (typeof document.midiAccessObj !== 'undefined' && document.midiAccessObj.inputs.size > 0) {
      setIsMidiDeviceConnected(true);
      return;
    }
    // Triggers if browser supports Web MIDI API, even if no MIDI device is connected
    function onMIDISuccess(midiAccessObj) {
      if (midiAccessObj.inputs.size > 0) {
        setIsMidiDeviceConnected(true);
      }
      if (!document.midiAccessObj) {
        document.midiAccessObj = midiAccessObj;
      }
    }
    function onMIDIFailure(error) {
      console.log(error);
    }

    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
  }, [isMidiDeviceConnected]);

  return isMidiDeviceConnected;
}

// Load the midi file defined in midi-piano-editor.js
export function useMidiData(src) {
  const [midiData, setMidiData] = useState(null);

  useEffect(() => {
    if (!src || midiData) {
      return;
    }
    const httpClient = new HttpClient();
    httpClient.get(src, { responseType: 'arraybuffer' })
      .then(response => {
        setMidiData(response.data);
      });
  }, [src, midiData]);

  return midiData;
}

export function useMidiPlayer(midiData) {
  const midiPlayer = useRef(null);
  const midiPlayerHandlerRef = useRef({
    handleMidiPlayerEvent: () => {},
    resetAllKeyStyles: () => {},
    updateActiveNotes: () => {}
  });

  if (!midiPlayer.current && midiData) {
    import('midi-player-js')
      .then(module => {
        midiPlayer.current = new module.default.Player();
        midiPlayer.current.on('midiEvent', message => {
          midiPlayerHandlerRef.current.handleMidiPlayerEvent(message);
        });
        midiPlayer.current.on('endOfFile', () => {
          midiPlayer.current.stop();
          midiPlayerHandlerRef.current.resetAllKeyStyles();
          midiPlayerHandlerRef.current.updateActiveNotes('Reset');
        });
        midiPlayer.current.loadArrayBuffer(midiData);
      });
  }

  return [midiPlayer, midiPlayerHandlerRef];
}

/**
 * This Hook initiates a Tone.js sampler used for playback of any notes.
 * The Sampler is stored on the browser document object so that it can be accessed by every piano on the page.
 * Currently there are only piano samples available. By including the sampleType variable it will be easy to add further samples like Harpsichord later.
 */
export function useToneJsSampler(sampleType) {
  const [hasSamplerLoaded, setHasSamplerLoaded] = useState(false);
  const sampler = useRef(null);

  const setupToneJsSampler = useCallback(() => {
    import('tone')
      .then(module => {
        document.toneJsSamplers[sampleType] = new module.Sampler({
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
            setHasSamplerLoaded(true);
            sampler.current = document.toneJsSamplers[sampleType];
          },
          baseUrl: 'https://tonejs.github.io/audio/salamander/' // Samples better be hosted in project XXX
        }).toDestination();
      });
  }, [sampleType]);

  useEffect(() => {

    if (document.toneJsSamplers?.[sampleType]) {
      if (!hasSamplerLoaded) {
        setHasSamplerLoaded(true);
        sampler.current = document.toneJsSamplers[sampleType];
      }
      return;
    }

    if (!document.toneJsSamplers) {
      document.toneJsSamplers = {};
    }

    setupToneJsSampler();

  }, [hasSamplerLoaded, setHasSamplerLoaded, sampleType, setupToneJsSampler]);

  return [sampler, hasSamplerLoaded];
}

// Set unique pianoId which does not start with a number character for use as CSS selector in updateMidiInputSwitches in midi-piano-display.js
export function usePianoId(defaultValue) {
  const [pianoId, setPianoId] = useState(defaultValue);

  useEffect(() => {
    const id = `ID${createId()}`;
    setPianoId(id);
  }, []);

  return pianoId;
}

export function useExercise(content, currentTestIndex, currentExerciseIndex, defaultKeyRange) {

  const currentTest = useCallback(() => content.tests[currentTestIndex], [content.tests, currentTestIndex]);
  const currentNoteSequence = useCallback(() => currentTest().customNoteSequences[currentExerciseIndex], [currentExerciseIndex, currentTest]);

  // Used for all exercise modes except chord mode which as own method. NoteRange (defined with slider in editor) becomes rendered piano keyRange.
  // Checks if noteRange is too narrow for exercise and if so widens it.
  const getKeyRange = useCallback(params => {
    const { intervalVectors, midiNoteNameSequence, noteRange } = params;
    const test = currentTest();

    let [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = ut.getBorderKeyRangeMidiValues(noteRange);

    [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = ut.widenKeyRangeIfNeeded({ test, intervalVectors, noteRange, midiNoteNameSequence });

    // Make sure widened keyRange is part of actual piano key range
    [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = ut.shiftKeyRangeIfNeeded(firstKeyRangeMidiValue, lastKeyRangeMidiValue);

    // Make sure first and last midi value belongs to white key
    firstKeyRangeMidiValue = C.WHITE_KEYS_MIDI_VALUES.includes(firstKeyRangeMidiValue) ? firstKeyRangeMidiValue : firstKeyRangeMidiValue - 1;
    lastKeyRangeMidiValue = C.WHITE_KEYS_MIDI_VALUES.includes(lastKeyRangeMidiValue) ? lastKeyRangeMidiValue : lastKeyRangeMidiValue + 1;

    // Convert midi values to white key indices which are needed for rendering CustomPiano
    return {
      first: C.WHITE_KEYS_MIDI_VALUES.indexOf(firstKeyRangeMidiValue),
      last: C.WHITE_KEYS_MIDI_VALUES.indexOf(lastKeyRangeMidiValue)
    };

  }, [currentTest]);

  const getKeyRangeForChordMode = useCallback((noteRange, chordVectors) => {
    let [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = ut.getBorderKeyRangeMidiValues(noteRange);

    for (const chordVector of chordVectors) {
      [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = ut.widenKeyRangeIfNeeded({ test: currentTest(), chordVector, noteRange });
    }

    return {
      first: C.WHITE_KEYS_MIDI_VALUES.indexOf(firstKeyRangeMidiValue),
      last: C.WHITE_KEYS_MIDI_VALUES.indexOf(lastKeyRangeMidiValue)
    };
  }, [currentTest]);

  const getIntervalVectors = useCallback((test, intervalCheckboxStates) => {

    if (intervalCheckboxStates.all) {
      return C.INTERVAL_VECTORS.all;
    }

    const intervalVectors = [];

    for (const interval of C.INTERVAL_NAMES) {
      if (typeof intervalCheckboxStates[interval].minor !== 'undefined') {

        /**
         * In white keys only mode (random note sequence mode) is checked, you can not check minor or major type of interval in editor.
         * If white keys only and interval is checked, only minor interval type vector is included.
         * If minor interval type vector leads to black key, minor interval type vector + 1 (major interval type vector) will be used to generate new note.
         */
        if (ut.usesWhiteKeysOnly(test)) {
          (intervalCheckboxStates[interval].minor || intervalCheckboxStates[interval].major) && intervalVectors.push(C.INTERVAL_VECTORS[interval].minor);
        } else {
          intervalVectors.push(intervalCheckboxStates[interval].minor ? C.INTERVAL_VECTORS[interval].minor : null);
          intervalVectors.push(intervalCheckboxStates[interval].major ? C.INTERVAL_VECTORS[interval].major : null);
        }
      } else {
        intervalVectors.push(intervalCheckboxStates[interval] ? C.INTERVAL_VECTORS[interval] : null);
      }
    }
    return intervalVectors.filter(interval => interval);
  }, []);

  const getSequencesForIntervalMode = useCallback((keyRange, intervalVectors) => {
    const test = currentTest();
    const midiValueSequence = [];
    const abcNoteNameSequence = [];
    const midiNoteNameSequence = [];

    let indicationMidiValue = ut.getIndicationMidiValue(keyRange);
    const [useVectorUpOnly, useVectorDownOnly] = ut.getVectorDirections(test);
    const vector = ut.getVector(intervalVectors);
    const vectorWithDirection = ut.getVectorWithDirection(vector, useVectorUpOnly, useVectorDownOnly);

    let nextMidiValue = indicationMidiValue + vectorWithDirection;

    if (!ut.isInRange(keyRange, nextMidiValue)) {
      indicationMidiValue = ut.adjustIndicationMidiValue(keyRange, vectorWithDirection);
      nextMidiValue = indicationMidiValue + vectorWithDirection;
    }

    if (ut.allowsLargeIntervals(test)) {
      const possibleNextMidiValues = ut.getPossibleNextMidiValues(indicationMidiValue, vectorWithDirection, keyRange);
      if (possibleNextMidiValues.length !== 0) {
        nextMidiValue = ut.randomArrayElem(possibleNextMidiValues);
      }
    }

    midiValueSequence.push(indicationMidiValue);
    abcNoteNameSequence.push(C.ABC_NOTE_NAMES[indicationMidiValue]);
    midiNoteNameSequence.push(C.MIDI_NOTE_NAMES[indicationMidiValue]);

    midiValueSequence.push(nextMidiValue);
    abcNoteNameSequence.push(C.ABC_NOTE_NAMES[nextMidiValue]);
    midiNoteNameSequence.push(C.MIDI_NOTE_NAMES[nextMidiValue]);

    return [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence];
  }, [currentTest]);

  const getSequencesForRandomNoteSequenceMode = useCallback((keyRange, intervalVectors) => {
    const test = currentTest();

    const midiValueSequence = [];
    const abcNoteNameSequence = [];
    const midiNoteNameSequence = [];

    const [indicationMidiValue, firstVector] = ut.getIndicationMidiValueAndFirstVector(test, keyRange, intervalVectors);

    midiValueSequence.push(indicationMidiValue);
    abcNoteNameSequence.push(C.ABC_NOTE_NAMES[indicationMidiValue]);
    midiNoteNameSequence.push(C.MIDI_NOTE_NAMES[indicationMidiValue]);

    let currentMidiValue = indicationMidiValue;
    // - 1 since first note (indication) has already been generated
    const numberOfNotes = currentTest().numberOfNotes - 1;

    for (let i = 0; i < numberOfNotes; i += 1) {
      const nextMidiValue = ut.getNextNoteSequenceVectorAndMidiValue(test, currentMidiValue, keyRange, intervalVectors, firstVector, i);

      midiValueSequence.push(nextMidiValue);
      abcNoteNameSequence.push(C.ABC_NOTE_NAMES[nextMidiValue]);
      midiNoteNameSequence.push(C.MIDI_NOTE_NAMES[nextMidiValue]);

      currentMidiValue = nextMidiValue;
    }

    return [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence];
  }, [currentTest]);

  const getSolution = useCallback(abcNoteNameSequence => {
    let solution = '';
    for (const noteName of abcNoteNameSequence) {
      solution += noteName;
    }
    return solution;
  }, []);

  const getChordVectors = useCallback(() => {
    const chordVectors = [];
    const test = currentTest();
    const triadCheckboxStates = test.triadCheckboxStates;
    const seventhChordCheckboxStates = test.seventhChordCheckboxStates;
    const inversionCheckboxStates = test.inversionCheckboxStates;
    const triads = Object.keys(triadCheckboxStates).map(key => triadCheckboxStates[key] && key).filter(elem => elem);
    const seventhChords = Object.keys(seventhChordCheckboxStates).map(key => seventhChordCheckboxStates[key] && key).filter(elem => elem);
    const inversions = Object.keys(inversionCheckboxStates).map(key => inversionCheckboxStates[key] && key).filter(elem => elem);

    for (const inversion of inversions) {
      chordVectors.push(...triads.map(triad => C.CHORD_VECTORS.triads[triad][inversion]).filter(elem => elem));
      chordVectors.push(...seventhChords.map(seventhChord => C.CHORD_VECTORS.seventhChords[seventhChord][inversion]));
    }

    return chordVectors;
  }, [currentTest]);

  const getSequencesAndChordVector = useCallback((keyRange, chordVectors) => {

    let midiValueSequence = [];
    const [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = ut.getBorderKeyRangeMidiValues(keyRange);

    // In chord mode indication key is always bass note. Make sure bassNote key is in lower half of keyRange
    const bassNoteMidiValue = ut.randomIntBetween(firstKeyRangeMidiValue, (firstKeyRangeMidiValue + lastKeyRangeMidiValue) / 2);
    midiValueSequence.push(bassNoteMidiValue);

    // For example, chordVector for dominantseventh chord is [4, 7, 10]
    const chordVector = ut.randomArrayElem(chordVectors);

    for (let i = 0; i < chordVector.length; i += 1) {
      const nextMidiValue = ut.getNextChordMidiValue(currentTest(), bassNoteMidiValue, chordVector[i], keyRange);
      midiValueSequence.push(nextMidiValue);
    }

    midiValueSequence = ut.sortLowToHigh(midiValueSequence);

    const abcNoteNameSequence = midiValueSequence.map(value => C.ABC_NOTE_NAMES[value]);
    const midiNoteNameSequence = midiValueSequence.map(value => C.MIDI_NOTE_NAMES[value]);

    return [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence, chordVector];
  }, [currentTest]);

  const getData = useCallback(
    () => {
      if (content.tests.length === 0) {
        return null;
      }

      const test = currentTest();
      const contentKeyRange = content.keyRange;

      if (ut.isCustomNoteSequenceExercise(test)) {
        const noteSequence = currentNoteSequence();
        const midiNoteNameSequence = noteSequence.midiNoteNameSequence;
        const keyRange = getKeyRange({ midiNoteNameSequence, noteRange: noteSequence.noteRange });

        return { keyRange,
          midiNoteNameSequence,
          clef: noteSequence.clef,
          solution: noteSequence.filteredAbc,
          indication: noteSequence.abcNoteNameSequence[0],
          midiValueSequence: noteSequence.midiValueSequence,
          abcNoteNameSequence: noteSequence.abcNoteNameSequence,
          indicationMidiValue: noteSequence.midiValueSequence[0] };
      }

      if (ut.isRandomNoteSequenceExercise(test)) {
        const intervalCheckboxStates = test.noteSequenceCheckboxStates;
        const intervalVectors = getIntervalVectors(test, intervalCheckboxStates);
        const keyRange = getKeyRange({ intervalVectors, noteRange: test.noteSequenceNoteRange });
        const [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence] = getSequencesForRandomNoteSequenceMode(keyRange, intervalVectors);
        const solution = getSolution(abcNoteNameSequence);

        return {
          keyRange,
          solution,
          clef: test.clef,
          midiValueSequence,
          abcNoteNameSequence,
          midiNoteNameSequence,
          indication: abcNoteNameSequence[0],
          indicationMidiValue: midiValueSequence[0]
        };
      }

      if (ut.isIntervalExercise(test)) {
        const checkboxStates = test.intervalCheckboxStates;
        const intervalVectors = getIntervalVectors(test, checkboxStates);
        const keyRange = getKeyRange({ intervalVectors, noteRange: test.intervalNoteRange });
        const [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence] = getSequencesForIntervalMode(keyRange, intervalVectors);

        return {
          keyRange,
          midiValueSequence,
          abcNoteNameSequence,
          midiNoteNameSequence,
          indication: abcNoteNameSequence[0],
          indicationMidiValue: midiValueSequence[0]
        };
      }

      if (ut.isChordExercise(test)) {
        const chordVectors = getChordVectors();
        const keyRange = getKeyRangeForChordMode(test.chordNoteRange, chordVectors);
        const [midiValueSequence, midiNoteNameSequence, abcNoteNameSequence, chordVector] = getSequencesAndChordVector(keyRange, chordVectors);

        return {
          keyRange,
          chordVector,
          midiValueSequence,
          abcNoteNameSequence,
          midiNoteNameSequence,
          indication: abcNoteNameSequence[0],
          indicationMidiValue: midiValueSequence[0]
        };
      }

      return {
        keyRange: contentKeyRange
      };
    },
    [
      currentTest,
      getKeyRange,
      getSolution,
      getChordVectors,
      content.keyRange,
      getIntervalVectors,
      currentNoteSequence,
      content.tests.length,
      getKeyRangeForChordMode,
      getSequencesAndChordVector,
      getSequencesForIntervalMode,
      getSequencesForRandomNoteSequenceMode
    ]
  );

  // No dependency needed since only needs to execute once
  const defaultData = useMemo(() => {
    const keyRange = getData().keyRange;
    return {
      abcNoteNameSequence: [],
      keyRange: keyRange ? keyRange : defaultKeyRange,
      indication: '',
      solution: ''
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If getData was called as useState callback, server and client would generate different indicationMidiValues,
  // which would result in blue indication piano key changing on page load.
  const [exerciseData, setExerciseData] = useState(defaultData);

  useEffect(() => {
    setExerciseData(() => getData());
  }, [currentTestIndex, getData]);

  return exerciseData;
}
