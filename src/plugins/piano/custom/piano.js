import PropTypes from 'prop-types';
import id from '../../../utils/unique-id.js';
import React, { useEffect, useRef } from 'react';
import { KeyWhite, KeyWhiteWithBlack } from './keys.js';
import { EXERCISE_TYPES, MIDI_NOTE_NAMES } from './constants.js';

// 0 represents white and black key, 1 respresents white key. Second element is midiValue for white key.
export const pianoLayout = [
  [0, 21], [1, 23], [0, 24], [0, 26], [1, 28], [0, 29], [0, 31], [0, 33], [1, 35], [0, 36], [0, 38], [1, 40], [0, 41], [0, 43], [0, 45], [1, 47], [0, 48],
  [0, 50], [1, 52], [0, 53], [0, 55], [0, 57], [1, 59], [0, 60], [0, 62], [1, 64], [0, 65], [0, 67], [0, 69], [1, 71], [0, 72], [0, 74], [1, 76], [0, 77],
  [0, 79], [0, 81], [1, 83], [0, 84], [0, 86], [1, 88], [0, 89], [0, 91], [0, 93], [1, 95], [0, 96], [0, 98], [1, 100], [0, 101], [0, 103], [0, 105],
  [1, 107], [1, 108]
];

export default function Piano(props) {

  const { keys,
    test,
    colors,
    pianoId,
    content,
    sampler,
    inputNote,
    activeNotes,
    exerciseData,
    updateKeyStyle,
    canShowSolution,
    hasSamplerLoaded,
    updateActiveNotes,
    isNoteInputEnabled,
    isExercisePlayingRef,
    answerMidiValueSequence } = props;

  const { keyRange } = exerciseData ? exerciseData : content;
  const { midiValueSequence } = exerciseData ? exerciseData : [];
  const indicationMidiValue = midiValueSequence ? midiValueSequence[0] : null;
  const piano = useRef(null);
  const exerciseType = test.exerciseType;
  const keyRangeLayout = pianoLayout.slice(keyRange.first, keyRange.last + 1);

  const getNoteNameFromMidiValue = midiValue => {
    return MIDI_NOTE_NAMES[midiValue];
  };

  const isBlackKey = key => {
    if (key.classList.contains('Piano-keyBlack')) {
      return true;
    }
    return false;
  };

  const playNote = midiValue => {
    if (!hasSamplerLoaded) {
      return;
    }
    sampler.current.triggerAttack(getNoteNameFromMidiValue(midiValue));
  };

  const stopNote = midiValue => {
    if (!hasSamplerLoaded) {
      return;
    }
    setTimeout(() => {
      sampler.current.triggerRelease(getNoteNameFromMidiValue(midiValue));
    }, 150);
  };

  const handleMouseDown = e => {
    if (typeof e.target.dataset.midiValue === 'undefined') {
      return;
    }
    const midiValue = parseInt(e.target.dataset.midiValue, 10);

    if (isExercisePlayingRef.current) {
      return;
    }

    updateActiveNotes('Note on', midiValue);

    playNote(midiValue);
  };

  const handleMouseUp = e => {
    if (typeof e.target.dataset.midiValue === 'undefined' || isExercisePlayingRef.current) {
      return;
    }

    const midiValue = parseInt(e.target.dataset.midiValue, 10);

    if (isNoteInputEnabled.current) {
      inputNote(midiValue);
    }

    updateActiveNotes('Note off', midiValue);
    stopNote(midiValue);
  };

  const handleMouseOver = e => {
    const key = e.target;
    const midiValue = parseInt(key.dataset.midiValue, 10);
    if (isBlackKey(key)) {
      e.preventDefault();
      const parent = key.parentElement;
      const parentMidiValue = parseInt(parent.dataset.midiValue, 10);
      updateKeyStyle('Note off', parentMidiValue);
      const index = activeNotes.current.indexOf(parentMidiValue);
      if (index !== -1) {
        stopNote(parentMidiValue);
        updateActiveNotes('Note off', parentMidiValue);
      }
    }

    if (content.tests.length === 0 || exerciseType === EXERCISE_TYPES.noteSequence) {
      updateKeyStyle('Note on', midiValue);
    }
  };

  const handleMouseOut = e => {
    const key = e.target;
    const midiValue = parseInt(key.dataset.midiValue, 10);
    const index = activeNotes.current.indexOf(midiValue);
    if (index !== -1) {
      updateActiveNotes('Note off', midiValue);
      stopNote(midiValue);
    }
    if (![EXERCISE_TYPES.interval, EXERCISE_TYPES.chord].includes(exerciseType) && midiValue !== indicationMidiValue) {
      updateKeyStyle('Note off', midiValue);
    }
  };

  useEffect(() => {
    piano.current.addEventListener('mousedown', handleMouseDown);
    piano.current.addEventListener('mouseup', handleMouseUp);

    return function cleanup() {
      piano.current?.removeEventListener('mousedown', handleMouseDown);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      piano.current?.removeEventListener('mouseup', handleMouseUp);
    };
  });

  useEffect(() => {
    const keyElems = document.querySelectorAll(`#${pianoId} .Piano-key`);
    for (const key of keyElems) {
      key.addEventListener('mouseover', handleMouseOver);
      key.addEventListener('mouseleave', handleMouseOut);
    }
    keys.current = [];
    for (let i = 0; i < keyElems.length; i += 1) {
      const index = parseInt(keyElems[i].dataset.midiValue, 10);
      keys.current[index] = keyElems[i];
    }
  });

  // Make sure active keys will be styled via DOM manipulation when note input via midi device has triggered rerender
  useEffect(() => {
    if (exerciseType === EXERCISE_TYPES.noteSequence) {
      for (const midiValue of activeNotes.current) {
        if (!answerMidiValueSequence.includes(midiValue)) {
          const key = keys.current[midiValue];
          key.style.backgroundColor = colors.activeKey;
        }
      }
    }
  });

  return (
    <div ref={piano} id={pianoId} className="Piano-pianoContainer">
      {keyRangeLayout.map((elem, index) => {
        if (elem[0] === 0 && index < keyRangeLayout.length - 1) {
          return (
            <KeyWhiteWithBlack
              colors={colors}
              key={id.create()}
              midiValue={elem[1]}
              exerciseType={exerciseType}
              canShowSolution={canShowSolution}
              midiValueSequence={midiValueSequence}
              answerMidiValueSequence={answerMidiValueSequence}
              />
          );
        }
        return (
          <KeyWhite
            colors={colors}
            key={id.create()}
            midiValue={elem[1]}
            exerciseType={exerciseType}
            canShowSolution={canShowSolution}
            midiValueSequence={midiValueSequence}
            answerMidiValueSequence={answerMidiValueSequence}
            />
        );
      })}
    </div>
  );
}

Piano.propTypes = {
  activeNotes: PropTypes.object.isRequired,
  answerMidiValueSequence: PropTypes.array,
  canShowSolution: PropTypes.bool,
  colors: PropTypes.object.isRequired,
  content: PropTypes.object.isRequired,
  exerciseData: PropTypes.object,
  hasSamplerLoaded: PropTypes.bool.isRequired,
  inputNote: PropTypes.func,
  isExercisePlayingRef: PropTypes.object.isRequired,
  isNoteInputEnabled: PropTypes.object,
  keys: PropTypes.object.isRequired,
  pianoId: PropTypes.string.isRequired,
  sampler: PropTypes.object,
  test: PropTypes.object,
  updateActiveNotes: PropTypes.func.isRequired,
  updateKeyStyle: PropTypes.func.isRequired
};

Piano.defaultProps = {
  answerMidiValueSequence: [],
  canShowSolution: false,
  exerciseData: {},
  inputNote: () => {},
  isNoteInputEnabled: {},
  sampler: {},
  test: { exerciseType: '' }
};

