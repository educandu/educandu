import { WHITE_KEYS_MIDI_VALUES, EXERCISE_TYPES, NOTE_CONVERSION_MAP, MIDI_NOTE_NAMES, INVERSIONS, TRIADS } from './constants.js';

export const hallo = 'Hallo';

export const randomIntBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const sortLowToHigh = array => {
  return array.sort((a, b) => a - b);
};

export const randomArrayElem = array => {
  return array[randomIntBetween(0, array.length - 1)];
};

export const getMidiValueFromWhiteKeyIndex = index => WHITE_KEYS_MIDI_VALUES[index];
export const getMidiValueFromNoteName = noteName => MIDI_NOTE_NAMES.indexOf(noteName);
export const getMidiValueFromMidiNoteName = midiNoteName => MIDI_NOTE_NAMES.indexOf(midiNoteName);
export const getNoteNameFromMidiValue = midiValue => MIDI_NOTE_NAMES[midiValue];

export const isIntervalExercise = test => test.exerciseType === EXERCISE_TYPES.interval;
export const isChordExercise = test => test.exerciseType === EXERCISE_TYPES.chord;
export const isNoteSequenceExercise = test => test.exerciseType === EXERCISE_TYPES.noteSequence;
export const isRandomNoteSequenceExercise = test => test.exerciseType === EXERCISE_TYPES.noteSequence && !test.isCustomNoteSequence;
export const isCustomNoteSequenceExercise = test => test.exerciseType === EXERCISE_TYPES.noteSequence && test.isCustomNoteSequence;
export const isIntervalOrChordExercise = test => isIntervalExercise(test) || isChordExercise(test);
export const allowsLargeIntervals = test => test[`${test.exerciseType}AllowsLargeIntervals`];

export const getBorderKeyRangeMidiValues = noteRange => [getMidiValueFromWhiteKeyIndex(noteRange.first), getMidiValueFromWhiteKeyIndex(noteRange.last)];

export const isAnswerComplete = params => {
  const { test, answerMidiValueSequence, midiValueSequence, answerAbcNoteNameSequenceRef, abcNoteNameSequence } = params;
  if (isNoteSequenceExercise(test)) {
    return answerAbcNoteNameSequenceRef.current.length >= abcNoteNameSequence.length - 1;
  }
  return answerMidiValueSequence.length >= midiValueSequence.length - 1;
};

export function filterAbcString(string) {
  let newString = string;
  const validChars = ['^', '_', 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'C', 'D', 'E', 'F', 'G', 'A', 'B', '\'', ','];

  const charsToDelete = [];
  for (let i = 0; i < newString.length; i += 1) {
    if (!validChars.includes(newString[i])) {
      !charsToDelete.includes(newString[i]) && charsToDelete.push(newString[i]);
    }
  }
  charsToDelete.forEach(elem => {
    newString = newString.replaceAll(elem, '');
  });

  return newString;
}

export function analyseABC(string) {
  if (string.length === 0) {
    return { abcNoteNameSequence: null,
      midiNoteNameSequence: null,
      midiValueSequence: null,
      filteredAbc: null };
  }

  const noteNameLetters = ['c', 'd', 'e', 'f', 'g', 'a', 'b', 'z', 'x', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const noteStartChars = ['^', '_', 'c', 'd', 'e', 'f', 'g', 'a', 'b', 'z', 'x', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const abcNoteNameSequence = [];
  const midiNoteNameSequence = [];
  const midiValueSequence = [];
  let newString = filterAbcString(string);
  const filteredAbc = newString;

  while (newString.length > 0 || typeof newString !== 'undefined') {

    let index = 0;
    let noteNameLetterIndex;
    let isNoteNameLetterFound = false;

    while (!noteStartChars.includes(newString[index])) {
      index += 1;
    }

    if (noteNameLetters.includes(newString[index])) {
      isNoteNameLetterFound = true;
      noteNameLetterIndex = index;
    }

    const noteStartIndex = index;
    let nextNoteStartIndex;
    index += 1;

    while (!isNoteNameLetterFound || typeof nextNoteStartIndex === 'undefined') {
      if (typeof newString[index] === 'undefined') {
        break;
      }
      if (!isNoteNameLetterFound && noteNameLetters.includes(newString[index].toLowerCase())) {
        isNoteNameLetterFound = true;
        noteNameLetterIndex = index;
      }
      if (isNoteNameLetterFound && noteNameLetterIndex !== index && noteStartChars.includes(newString[index])) {
        nextNoteStartIndex = index;
      }
      index += 1;
    }

    // Checks if only last note is remaining.
    if (typeof nextNoteStartIndex === 'undefined') {
      let lastNote = true;
      for (let i = index; i < newString.length; i += 1) {
        if (noteNameLetters.includes(newString[i])) {
          lastNote = false;
        }
      }
      if (lastNote) {
        const abcNoteName = newString.substring(0);
        const midiNoteName = NOTE_CONVERSION_MAP.get(abcNoteName);
        const midiValue = getMidiValueFromMidiNoteName(midiNoteName);
        abcNoteNameSequence.push(abcNoteName);
        midiNoteNameSequence.push(midiNoteName);
        midiValueSequence.push(midiValue);
        return { abcNoteNameSequence, midiNoteNameSequence, midiValueSequence, filteredAbc };
      }
    }

    const abcNoteName = newString.substring(noteStartIndex, nextNoteStartIndex);
    const midiNoteName = NOTE_CONVERSION_MAP.get(abcNoteName);
    const midiValue = getMidiValueFromMidiNoteName(midiNoteName);
    abcNoteNameSequence.push(abcNoteName);
    midiNoteNameSequence.push(midiNoteName);
    midiValueSequence.push(midiValue);

    newString = newString.substring(nextNoteStartIndex);

    if (typeof newString[0] === 'undefined') {
      return { abcNoteNameSequence, midiNoteNameSequence, midiValueSequence, filteredAbc };
    }
  }
  return { abcNoteNameSequence, midiNoteNameSequence, midiValueSequence, filteredAbc };
}

export const playNotesSimultaneously = async (sampler, midiNoteNameSequence, noteDurationRef, isExercisePlayingRef) => {
  sampler.triggerAttackRelease(midiNoteNameSequence, noteDurationRef.current / 1000);
  await new Promise(res => {
    setTimeout(() => {
      res();
      isExercisePlayingRef.current = false;
    }, noteDurationRef.current);
  });
};

export const playNotesSuccessively = async (sampler, midiNoteNameSequence, noteDurationRef, isExercisePlayingRef, playExerciseStartIndex) => {
  for (let i = playExerciseStartIndex; i < midiNoteNameSequence.length; i += 1) {
    // Check if stop button has been clicked
    if (!isExercisePlayingRef.current) {
      return;
    }
    sampler.triggerAttackRelease(midiNoteNameSequence[i], noteDurationRef.current / 1000);
    // eslint-disable-next-line no-await-in-loop
    await new Promise(res => {
      setTimeout(() => {
        res();
      }, noteDurationRef.current);
    });
  }
  isExercisePlayingRef.current = false;
};

export const isKeyOutOfRange = (keyRange, midiValue) => {
  if (midiValue < WHITE_KEYS_MIDI_VALUES[keyRange.first] || midiValue > WHITE_KEYS_MIDI_VALUES[keyRange.last]) {
    return true;
  }
  return false;
};

export const usesWhiteKeysOnly = test => {
  return test.exerciseType === EXERCISE_TYPES.noteSequence
    && !test.isCustomNoteSequence
    && test.whiteKeysOnly;
};

export const isInRange = (keyRange, midiValue) => {
  const [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = getBorderKeyRangeMidiValues(keyRange);
  return midiValue >= firstKeyRangeMidiValue && midiValue <= lastKeyRangeMidiValue;
};

export const isWhiteKey = midiValue => WHITE_KEYS_MIDI_VALUES.indexOf(midiValue) !== -1;

export const getIndicationMidiValueAndFirstVector = (test, keyRange, intervalVectors) => {
  const [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = getBorderKeyRangeMidiValues(keyRange);
  let indicationMidiValue = randomIntBetween(firstKeyRangeMidiValue, lastKeyRangeMidiValue);
  const firstVector = randomArrayElem(intervalVectors);
  if (usesWhiteKeysOnly(test) && !isWhiteKey(indicationMidiValue)) {
    indicationMidiValue = indicationMidiValue + 1 <= lastKeyRangeMidiValue ? indicationMidiValue + 1 : indicationMidiValue - 1;
    if ((!isWhiteKey(indicationMidiValue + firstVector) || !isInRange(keyRange, indicationMidiValue + firstVector)) && [5, 7].includes(firstVector)) {
      for (let i = firstKeyRangeMidiValue; i <= lastKeyRangeMidiValue; i += 1) {
        indicationMidiValue = i;
        if (isWhiteKey(indicationMidiValue) && isInRange(keyRange, indicationMidiValue + firstVector) && isWhiteKey(indicationMidiValue + firstVector)) {
          break;
        }
      }
    }
  }
  return [indicationMidiValue, firstVector];
};

export const getIndicationMidiValue = keyRange => {
  const [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = getBorderKeyRangeMidiValues(keyRange);
  const indicationMidiValue = randomIntBetween(firstKeyRangeMidiValue, lastKeyRangeMidiValue);
  return indicationMidiValue;
};

export const getWhiteKey = (midiValue, vector) => {
  return vector < 0 ? midiValue + vector - 1 : midiValue + vector + 1;
};

export const getNextNoteSequenceVectorAndMidiValue = (test, currentMidiValue, keyRange, intervalVectors, firstVector, i) => {
  const [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = getBorderKeyRangeMidiValues(keyRange);
  let newVector = i === 0 ? firstVector : randomArrayElem(intervalVectors) * randomArrayElem([-1, 1]);
  let nextMidiValue = currentMidiValue + newVector;

  while (!isInRange(keyRange, nextMidiValue) || (test.whiteKeysOnly && !isWhiteKey(nextMidiValue))) {
    newVector = randomArrayElem(intervalVectors) * randomArrayElem([-1, 1]);
    nextMidiValue = currentMidiValue + newVector;
  }

  if (allowsLargeIntervals(test)) {
    const possibleNextMidiValues = [];
    if (newVector < 0) {
      while (currentMidiValue + newVector > firstKeyRangeMidiValue) {
        possibleNextMidiValues.push(currentMidiValue + newVector);
        newVector -= 12;
      }
    } else if (newVector > 0) {
      while (currentMidiValue + newVector < lastKeyRangeMidiValue) {
        possibleNextMidiValues.push(currentMidiValue + newVector);
        newVector += 12;
      }
    }
    if (possibleNextMidiValues.length > 0) {
      nextMidiValue = randomArrayElem(possibleNextMidiValues);
    }
  }

  return nextMidiValue;
};

export const getNextChordMidiValue = (test, bassNoteMidiValue, vector, keyRange) => {
  const lastKeyRangeMidiValue = WHITE_KEYS_MIDI_VALUES[keyRange.last];
  let currentMidiValue = bassNoteMidiValue;
  let nextMidiValue = bassNoteMidiValue + vector;

  if (allowsLargeIntervals(test)) {
    const possibleMidiValues = [];

    while (currentMidiValue + vector < lastKeyRangeMidiValue) {
      possibleMidiValues.push(currentMidiValue + vector);
      currentMidiValue += 12;
    }
    nextMidiValue = randomArrayElem(possibleMidiValues);
  }

  return nextMidiValue;
};

export const getVectorDirections = test => {
  const directionCheckboxStates = test.directionCheckboxStates;
  if (directionCheckboxStates.up && !directionCheckboxStates.down) {
    return [true, false];
  }
  if (!directionCheckboxStates.up && directionCheckboxStates.down) {
    return [false, true];
  }
  return [false, false];
};

export const getVector = intervalVectors => randomArrayElem(intervalVectors);

export const getVectorWithDirection = (vector, useVectorUpOnly, useVectorDownOnly) => {
  let vectorWithDirection = vector;
  if (useVectorDownOnly) {
    vectorWithDirection *= -1;
  }
  if (!useVectorUpOnly && !useVectorDownOnly) {
    vectorWithDirection *= randomArrayElem([-1, 1]);
  }
  return vectorWithDirection;
};

export const adjustIndicationMidiValue = (keyRange, vectorWithDirection) => {
  const [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = getBorderKeyRangeMidiValues(keyRange);
  let indicationMidiValue = Math.floor((firstKeyRangeMidiValue + lastKeyRangeMidiValue) / 2);
  let nextMidiValue = indicationMidiValue + vectorWithDirection;
  if (vectorWithDirection < 0) {
    for (let i = indicationMidiValue; i <= lastKeyRangeMidiValue; i += 1) {
      if (isInRange(keyRange, nextMidiValue)) {
        break;
      }
      indicationMidiValue += 1;
      nextMidiValue += 1;
    }
  }
  if (vectorWithDirection > 0) {
    for (let i = indicationMidiValue; i >= firstKeyRangeMidiValue; i -= 1) {
      if (isInRange(keyRange, nextMidiValue)) {
        break;
      }
      indicationMidiValue -= 1;
      nextMidiValue -= 1;
    }
  }
  return indicationMidiValue;
};

export const getPossibleNextMidiValues = (indicationMidiValue, vectorWithDirection, keyRange) => {
  const [firstKeyRangeMidiValue, lastKeyRangeMidiValue] = getBorderKeyRangeMidiValues(keyRange);
  const arr = [];
  let modifiedVector = vectorWithDirection;
  if (modifiedVector < 0) {
    while ((indicationMidiValue + modifiedVector) > firstKeyRangeMidiValue) {
      arr.push(indicationMidiValue + modifiedVector);
      modifiedVector -= 12;
    }
  }
  if (modifiedVector > 0) {
    while ((indicationMidiValue + modifiedVector) < lastKeyRangeMidiValue) {
      arr.push(indicationMidiValue + modifiedVector);
      modifiedVector += 12;
    }
  }
  return arr;
};

export const widenKeyRangeIfNeeded = params => {
  const { noteRange, midiNoteNameSequence, test, intervalVectors, chordVector } = params;
  let firstKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(noteRange.first);
  let lastKeyRangeMidiValue = getMidiValueFromWhiteKeyIndex(noteRange.last);
  const vectors = isChordExercise(test) ? chordVector : intervalVectors;

  if (isCustomNoteSequenceExercise(test)) {
    for (let i = 0; i < midiNoteNameSequence.length; i += 1) {
      const midiValue = getMidiValueFromNoteName(midiNoteNameSequence[i]);
      if (midiValue < firstKeyRangeMidiValue) {
        firstKeyRangeMidiValue = midiValue;
      }
      if (midiValue > lastKeyRangeMidiValue) {
        lastKeyRangeMidiValue = midiValue;
      }
    }
  } else {
    for (const vector of vectors) {
      if (firstKeyRangeMidiValue > lastKeyRangeMidiValue - vector) {
        firstKeyRangeMidiValue = lastKeyRangeMidiValue - vector;
      }
      if (lastKeyRangeMidiValue < firstKeyRangeMidiValue + vector) {
        lastKeyRangeMidiValue = firstKeyRangeMidiValue + vector;
      }
    }
  }
  return [firstKeyRangeMidiValue, lastKeyRangeMidiValue];
};

export const shiftKeyRangeIfNeeded = (firstMidiVal, lastMidiVal) => {
  let firstKeyRangeMidiValue = firstMidiVal;
  let lastKeyRangeMidiValue = lastMidiVal;
  const width = lastKeyRangeMidiValue - firstKeyRangeMidiValue;

  // Since widenKeyRangeIfNeeded always adds keys below, only upwards shift is needed
  if (firstKeyRangeMidiValue < 21) {
    firstKeyRangeMidiValue = 21;
    lastKeyRangeMidiValue = width + 21;
  }
  return [firstKeyRangeMidiValue, lastKeyRangeMidiValue];
};

export const ensureOneInversionIsChecked = (index, newTests) => {
  let areAllInversionsUnchecked = true;
  for (const key of Object.keys(newTests[index].inversionCheckboxStates)) {
    if (newTests[index].inversionCheckboxStates[key]) {
      areAllInversionsUnchecked = false;
    }
  }
  if (areAllInversionsUnchecked) {
    newTests[index].inversionCheckboxStates[INVERSIONS.fundamental] = true;
  }
};

export const ensureOneChordIsChecked = (index, newTests) => {
  let areAllChordsUnchecked = true;
  for (const key of Object.keys(newTests[index].triadCheckboxStates)) {
    if (newTests[index].triadCheckboxStates[key]) {
      areAllChordsUnchecked = false;
    }
  }
  for (const key of Object.keys(newTests[index].seventhChordCheckboxStates)) {
    if (newTests[index].seventhChordCheckboxStates[key]) {
      areAllChordsUnchecked = false;
    }
  }
  if (areAllChordsUnchecked) {
    newTests[index].triadCheckboxStates[TRIADS.majorTriad] = true;
  }
};

export const ensureOneIntervalIsChecked = (index, newTests, exerciseType) => {
  let areAllIntervalsUnchecked = true;
  for (const key of Object.keys(newTests[index][`${exerciseType}CheckboxStates`])) {
    if (typeof newTests[index][`${exerciseType}CheckboxStates`][key].minor === 'undefined') {
      if (newTests[index][`${exerciseType}CheckboxStates`][key]) {
        areAllIntervalsUnchecked = false;
      }
    } else if (typeof newTests[index][`${exerciseType}CheckboxStates`][key].minor !== 'undefined') {
      if (newTests[index][`${exerciseType}CheckboxStates`][key].minor || newTests[index][`${exerciseType}CheckboxStates`][key].major) {
        areAllIntervalsUnchecked = false;
      }
    }
  }

  if (areAllIntervalsUnchecked) {
    newTests[index][`${exerciseType}CheckboxStates`].second.minor = true;
    newTests[index][`${exerciseType}CheckboxStates`].second.major = true;
  }
};

export const getNumberOfAbcNotes = string => {
  let numberOfAbcNotes = 0;
  const validNoteNameChars = ['c', 'd', 'e', 'f', 'g', 'a', 'b', 'C', 'D', 'E', 'F', 'G', 'A', 'B'];
  for (let i = 0; i < string.length; i += 1) {
    if (validNoteNameChars.includes(string[i])) {
      numberOfAbcNotes += 1;
    }
  }
  return numberOfAbcNotes;
};
