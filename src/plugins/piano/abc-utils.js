import { NOTE_CONVERSION_MAP, MIDI_NOTE_NAMES } from './constants.js';

const getMidiValueFromMidiNoteName = midiNoteName => MIDI_NOTE_NAMES.indexOf(midiNoteName);

export function filterAbcString(string) {
  const charsToDelete = [' ', '|', '=', '(', ')', '[', ']', '-', 'z', 'x', '1', '2', '3', '4', '5', '6', '7', '8'];
  let newString = string;

  charsToDelete.forEach(elem => {
    newString = newString.replaceAll(elem, '');
  });

  return newString;
}

// Returned variables are saved in content.tests[currentTestIndex].customNoteSequences[currentExerciseIndex]
export function analyseABC(string) {
  if (string.length === 0) {
    return [null, null, null, null];
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

    // Optimierbar? XXX
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
        return [abcNoteNameSequence, midiNoteNameSequence, midiValueSequence, filteredAbc];
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
      return [abcNoteNameSequence, midiNoteNameSequence, midiValueSequence, filteredAbc];
    }
  }
  return [abcNoteNameSequence, midiNoteNameSequence, midiValueSequence, filteredAbc];
}
