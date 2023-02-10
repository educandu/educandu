// Note names for each midi Value that can be played by Tone.js sampler. Also included in midi player namespace in .Constants.NOTES
export const MIDI_NOTE_NAMES = ['C-1', 'Db-1', 'D-1', 'Eb-1', 'E-1', 'F-1', 'Gb-1', 'G-1', 'Ab-1', 'A-1', 'Bb-1', 'B-1', 'C0', 'Db0', 'D0', 'Eb0', 'E0', 'F0', 'Gb0', 'G0', 'Ab0', 'A0', 'Bb0', 'B0', 'C1', 'Db1', 'D1', 'Eb1', 'E1', 'F1', 'Gb1', 'G1', 'Ab1', 'A1', 'Bb1', 'B1', 'C2', 'Db2', 'D2', 'Eb2', 'E2', 'F2', 'Gb2', 'G2', 'Ab2', 'A2', 'Bb2', 'B2', 'C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5', 'Db5', 'D5', 'Eb5', 'E5', 'F5', 'Gb5', 'G5', 'Ab5', 'A5', 'Bb5', 'B5', 'C6', 'Db6', 'D6', 'Eb6', 'E6', 'F6', 'Gb6', 'G6', 'Ab6', 'A6', 'Bb6', 'B6', 'C7', 'Db7', 'D7', 'Eb7', 'E7', 'F7', 'Gb7', 'G7', 'Ab7', 'A7', 'Bb7', 'B7', 'C8', 'Db8', 'D8', 'Eb8', 'E8', 'F8', 'Gb8', 'G8', 'Ab8', 'A8', 'Bb8', 'B8', 'C9', 'Db9', 'D9', 'Eb9', 'E9', 'F9', 'Gb9', 'G9', 'Ab9', 'A9', 'Bb9', 'B9'];

// Chromatic abc note names
export const ABC_NOTE_NAMES = ['C,,,,,', '^C,,,,,', 'D,,,,,', '_E,,,,,', 'E,,,,,', 'F,,,,,', '^F,,,,,', 'G,,,,,', '^G,,,,,', 'A,,,,,', '_B,,,,,', 'B,,,,,', 'C,,,,', '^C,,,,', 'D,,,,', '_E,,,,', 'E,,,,', 'F,,,,', '^F,,,,', 'G,,,,', '^G,,,,', 'A,,,,', '_B,,,,', 'B,,,,', 'C,,,', '^C,,,', 'D,,,', '_E,,,', 'E,,,', 'F,,,', '^F,,,', 'G,,,', '^G,,,', 'A,,,', '_B,,,', 'B,,,', 'C,,', '^C,,', 'D,,', '_E,,', 'E,,', 'F,,', '^F,,', 'G,,', '^G,,', 'A,,', '_B,,', 'B,,', 'C,', '^C,', 'D,', '_E,', 'E,', 'F,', '^F,', 'G,', '^G,', 'A,', '_B,', 'B,', 'C', '^C', 'D', '_E', 'E', 'F', '^F', 'G', '^G', 'A', '_B', 'B', 'c', '^c', 'd', '_e', 'e', 'f', '^f', 'g', '^g', 'a', '_b', 'b', 'c\'', '^c\'', 'd\'', '_e\'', 'e\'', 'f\'', '^f\'', 'g\'', '^g\'', 'a\'', '_b\'', 'b\'', 'c\'\'', '^c\'\'', 'd\'\'', '_e\'\'', 'e\'\'', 'f\'\'', '^f\'\'', 'g\'\'', '^g\'\'', 'a\'\'', '_b\'\'', 'b\'\'', 'c\'\'\'', '^c\'\'\'', 'd\'\'\'', '_e\'\'\'', 'e\'\'\'', 'f\'\'\'', '^f\'\'\'', 'g\'\'\'', '^g\'\'\'', 'a\'\'\'', '_b\'\'\'', 'b\'\'\'', 'c\'\'\'\'', '^c\'\'\'\'', 'd\'\'\'\'', '_e\'\'\'\'', 'e\'\'\'\'', 'f\'\'\'\'', '^f\'\'\'\'', 'g\'\'\'\'', '^g\'\'\'\'', 'a\'\'\'\'', '_b\'\'\'\'', 'b\'\'\'\''];

// Only white key abc note names
const abcNaturalNoteNames = ['C,,,,,', 'D,,,,,', 'E,,,,,', 'F,,,,,', 'G,,,,,', 'A,,,,,', 'B,,,,,', 'C,,,,', 'D,,,,', 'E,,,,', 'F,,,,', 'G,,,,', 'A,,,,', 'B,,,,', 'C,,,', 'D,,,', 'E,,,', 'F,,,', 'G,,,', 'A,,,', 'B,,,', 'C,,', 'D,,', 'E,,', 'F,,', 'G,,', 'A,,', 'B,,', 'C,', 'D,', 'E,', 'F,', 'G,', 'A,', 'B,', 'C', 'D', 'E', 'F', 'G', 'A', 'B', 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'c\'', 'd\'', 'e\'', 'f\'', 'g\'', 'a\'', 'b\'', 'c\'\'', 'd\'\'', 'e\'\'', 'f\'\'', 'g\'\'', 'a\'\'', 'b\'\'', 'c\'\'\'', 'd\'\'\'', 'e\'\'\'', 'f\'\'\'', 'g\'\'\'', 'a\'\'\'', 'b\'\'\'', 'c\'\'\'\'', 'd\'\'\'\'', 'e\'\'\'\'', 'f\'\'\'\'', 'g\'\'\'\'', 'a\'\'\'\'', 'b\'\'\'\''];

// Vectors that lead from white key to next white key
const incrementBy = new Map();
incrementBy.set('c', 2);
incrementBy.set('C', 2);
incrementBy.set('d', 2);
incrementBy.set('D', 2);
incrementBy.set('e', 1);
incrementBy.set('E', 1);
incrementBy.set('f', 2);
incrementBy.set('F', 2);
incrementBy.set('g', 2);
incrementBy.set('G', 2);
incrementBy.set('a', 2);
incrementBy.set('A', 2);
incrementBy.set('b', 1);
incrementBy.set('B', 1);

// Convert abc note names to midi note names which Tone.js sampler can play
export const NOTE_CONVERSION_MAP = (() => {
  const map = new Map();

  map.set(abcNaturalNoteNames[0], MIDI_NOTE_NAMES[0]);
  map.set(`^${abcNaturalNoteNames[0]}`, MIDI_NOTE_NAMES[1]);
  map.set(`^^${abcNaturalNoteNames[0]}`, MIDI_NOTE_NAMES[2]);

  let midiValue = 2;

  for (let i = 1; i < abcNaturalNoteNames.length - 2; i += 1) {
    map.set(abcNaturalNoteNames[i], MIDI_NOTE_NAMES[midiValue]);
    map.set(`^${abcNaturalNoteNames[i]}`, MIDI_NOTE_NAMES[midiValue + 1]);
    map.set(`^^${abcNaturalNoteNames[i]}`, MIDI_NOTE_NAMES[midiValue + 2]);
    map.set(`_${abcNaturalNoteNames[i]}`, MIDI_NOTE_NAMES[midiValue - 1]);
    map.set(`__${abcNaturalNoteNames[i]}`, MIDI_NOTE_NAMES[midiValue - 2]);

    midiValue += incrementBy.get(abcNaturalNoteNames[i][0]);
  }

  map.set(abcNaturalNoteNames[abcNaturalNoteNames.length - 1], MIDI_NOTE_NAMES[MIDI_NOTE_NAMES.length - 1]);
  map.set(`_${abcNaturalNoteNames[abcNaturalNoteNames.length - 1]}`, MIDI_NOTE_NAMES[MIDI_NOTE_NAMES.length - 2]);
  map.set(`__${abcNaturalNoteNames[abcNaturalNoteNames.length - 1]}`, MIDI_NOTE_NAMES[MIDI_NOTE_NAMES.length - 3]);

  return map;
})();

// Provide midi values for all white keys
export const WHITE_KEYS_MIDI_VALUES = (() => {
  const arr = [];
  const octave = [0, 2, 4, 5, 7, 9, 11];
  let summand = 24;

  arr.push(21);
  arr.push(23);

  for (let i = 0; i < 7; i += 1) {
    for (const value of octave) {
      arr.push(value + summand);
    }
    summand += 12;
  }
  arr.push(108);

  return arr;
})();

export const SAMPLE_TYPES = {
  piano: 'piano'
};

export const MIDI_COMMANDS = {
  noteOn: 144,
  noteOff: 128
};

export const EXERCISE_TYPES = {
  interval: 'interval',
  chord: 'chord',
  noteSequence: 'noteSequence'
};

export const INTERVAL_VECTORS = {
  all: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  prime: 0,
  second: {
    minor: 1,
    major: 2
  },
  third: {
    minor: 3,
    major: 4
  },
  fourth: 5,
  tritone: 6,
  fifth: 7,
  sixth: {
    minor: 8,
    major: 9
  },
  seventh: {
    minor: 10,
    major: 11
  },
  octave: 12
};

export const INTERVAL_NAMES = ['prime', 'second', 'third', 'fourth', 'tritone', 'fifth', 'sixth', 'seventh', 'octave'];

export const EVENT_TYPES = {
  noteOn: 'Note on',
  noteOff: 'Note off',
  toggle: 'toggle'
};

export const TRIADS = {
  majorTriad: 'majorTriad',
  minorTriad: 'minorTriad',
  diminished: 'diminished',
  augmented: 'augmented'
};

export const SEVENTH_CHORDS = ['majorTriadMinorSeventh', 'majorTriadMajorSeventh', 'minorTriadMinorSeventh', 'minorTriadMajorSeventh', 'halfDiminished', 'diminishedSeventh'];

export const INVERSIONS = {
  fundamental: 'fundamental',
  firstInversion: 'firstInversion',
  secondInversion: 'secondInversion',
  thirdInversion: 'thirdInversion'
};

export const CHORD_VECTORS = {
  triads: {
    majorTriad: {
      fundamental: [4, 7],
      firstInversion: [3, 8],
      secondInversion: [5, 9]
    },
    minorTriad: {
      fundamental: [3, 7],
      firstInversion: [4, 9],
      secondInversion: [5, 8]
    },
    diminished: {
      fundamental: [3, 6],
      firstInversion: [3, 9],
      secondInversion: [6, 9]
    },
    augmented: {
      fundamental: [4, 8],
      firstInversion: [4, 8],
      secondInversion: [4, 8]
    }
  },
  seventhChords: {
    majorTriadMinorSeventh: {
      fundamental: [4, 7, 10],
      firstInversion: [3, 6, 8],
      secondInversion: [3, 5, 9],
      thirdInversion: [2, 6, 9]
    },
    majorTriadMajorSeventh: {
      fundamental: [4, 7, 11],
      firstInversion: [3, 7, 8],
      secondInversion: [4, 5, 9],
      thirdInversion: [1, 5, 8]
    },
    minorTriadMinorSeventh: {
      fundamental: [3, 7, 10],
      firstInversion: [4, 7, 9],
      secondInversion: [3, 5, 8],
      thirdInversion: [2, 5, 9]
    },
    minorTriadMajorSeventh: {
      fundamental: [3, 7, 11],
      firstInversion: [4, 8, 9],
      secondInversion: [4, 5, 8],
      thirdInversion: [1, 4, 8]
    },
    halfDiminished: {
      fundamental: [3, 6, 10],
      firstInversion: [3, 7, 9],
      secondInversion: [4, 6, 9],
      thirdInversion: [2, 5, 8]
    },
    diminishedSeventh: {
      fundamental: [3, 6, 9],
      firstInversion: [3, 6, 9],
      secondInversion: [3, 6, 9],
      thirdInversion: [3, 6, 9]
    }
  }
};

export const CHORD_VECTOR_MAP = new Map([
  ['[4,7]', { type: 'majorChord', inversion: 'fundamental' }],
  ['[3,8]', { type: 'majorChord', inversion: 'firstInversion' }],
  ['[5,9]', { type: 'majorChord', inversion: 'secondInversion' }],
  ['[3,7]', { type: 'minorChord', inversion: 'fundamental' }],
  ['[4,9]', { type: 'minorChord', inversion: 'firstInversion' }],
  ['[5,8]', { type: 'minorChord', inversion: 'secondInversion' }],
  ['[3,6]', { type: 'diminishedTriad', inversion: 'fundamental' }],
  ['[3,9]', { type: 'diminishedTriad', inversion: 'firstInversion' }],
  ['[6,9]', { type: 'diminishedTriad', inversion: 'secondInversion' }],
  ['[4,8]', { type: 'augmentedTriad', inversion: 'anyInversion' }],
  ['[4,7,10]', { type: 'majorTriadMinorSeventh', inversion: 'fundamental' }],
  ['[3,6,8]', { type: 'majorTriadMinorSeventh', inversion: 'firstInversion' }],
  ['[3,5,9]', { type: 'majorTriadMinorSeventh', inversion: 'secondInversion' }],
  ['[2,6,9]', { type: 'majorTriadMinorSeventh', inversion: 'thirdInversion' }],
  ['[4,7,11]', { type: 'majorTriadMajorSeventh', inversion: 'fundamental' }],
  ['[3,7,8]', { type: 'majorTriadMajorSeventh', inversion: 'firstInversion' }],
  ['[4,5,9]', { type: 'majorTriadMajorSeventh', inversion: 'secondInversion' }],
  ['[1,5,8]', { type: 'majorTriadMajorSeventh', inversion: 'thirdInversion' }],
  ['[3,7,10]', { type: 'minorTriadMinorSeventh', inversion: 'fundamental' }],
  ['[4,7,9]', { type: 'minorTriadMinorSeventh', inversion: 'firstInversion' }],
  ['[3,5,8]', { type: 'minorTriadMinorSeventh', inversion: 'secondInversion' }],
  ['[2,5,9]', { type: 'minorTriadMinorSeventh', inversion: 'thirdInversion' }],
  ['[3,7,11]', { type: 'minorTriadMajorSeventh', inversion: 'fundamental' }],
  ['[4,8,9]', { type: 'minorTriadMajorSeventh', inversion: 'firstInversion' }],
  ['[4,5,8]', { type: 'minorTriadMajorSeventh', inversion: 'secondInversion' }],
  ['[1,4,8]', { type: 'minorTriadMajorSeventh', inversion: 'thirdInversion' }],
  ['[3,6,10]', { type: 'halfDiminished', inversion: 'fundamental' }],
  ['[3,7,9]', { type: 'halfDiminished', inversion: 'firstInversion' }],
  ['[4,6,9]', { type: 'halfDiminished', inversion: 'secondInversion' }],
  ['[2,5,8]', { type: 'halfDiminished', inversion: 'thirdInversion' }],
  ['[3,6,9]', { type: 'diminishedSeventh', inversion: 'anyInversion' }]
]);
