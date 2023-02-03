import React from 'react';
import PropTypes from 'prop-types';
import { EXERCISE_TYPES } from './constants.js';

const getStyle = (keyMidiValue, midiValueSequence, colors, canShowSolutionRef, answerMidiValueSequence, exerciseType) => {

  if (!midiValueSequence) {
    return null;
  }

  const indicationMidiValue = midiValueSequence ? midiValueSequence[0] : null;
  const isIndicationKey = keyMidiValue === indicationMidiValue;

  // In noteSequence mode, except for indication key, keys don't need to be styled on render because of abcNotation
  if (exerciseType === EXERCISE_TYPES.noteSequence) {
    if (isIndicationKey) {
      return { backgroundColor: colors.activeKey };
    }
    return null;
  }

  const style = {};
  const isSolutionKey = midiValueSequence.includes(keyMidiValue);
  const isAnswerKey = answerMidiValueSequence.includes(keyMidiValue);

  if (isSolutionKey && canShowSolutionRef.current) {
    style.backgroundColor = colors.correct;
  }
  if (isAnswerKey && !canShowSolutionRef.current) {
    style.backgroundColor = colors.answer;
  }
  if (isAnswerKey && !isSolutionKey && canShowSolutionRef.current) {
    style.backgroundColor = colors.wrong;
  }
  if (isIndicationKey) {
    style.backgroundColor = colors.activeKey;
    if (exerciseType === EXERCISE_TYPES.interval && midiValueSequence[0] === midiValueSequence[1] && canShowSolutionRef.current) {
      style.backgroundColor = colors.correct;
    }
  }

  return style;
};

export function KeyWhite(props) {

  const { index,
    colors,
    midiValue,
    exerciseType,
    canShowSolutionRef,
    midiValueSequence,
    updateKeyRangeSelection,
    answerMidiValueSequence } = props;

  return (
    <div
      className="MidiPiano-key MidiPiano-keyWhite"
      onClick={updateKeyRangeSelection}
      data-midi-value={midiValue}
      data-default-color={colors.whiteKey}
      data-index={index}
      style={getStyle(midiValue, midiValueSequence, colors, canShowSolutionRef, answerMidiValueSequence, exerciseType)}
      />
  );
}

export function KeyWhiteWithBlack(props) {

  const { index,
    colors,
    midiValue,
    exerciseType,
    canShowSolutionRef,
    midiValueSequence,
    updateKeyRangeSelection,
    answerMidiValueSequence } = props;

  return (
    <div
      className="MidiPiano-key MidiPiano-keyWhite"
      onClick={updateKeyRangeSelection}
      data-midi-value={midiValue}
      data-default-color={colors.whiteKey}
      data-index={index}
      style={getStyle(midiValue, midiValueSequence, colors, canShowSolutionRef, answerMidiValueSequence, exerciseType)}
      >
      <div
        className="MidiPiano-key MidiPiano-keyBlack"
        data-midi-value={midiValue + 1}
        data-default-color={colors.blackKey}
        style={getStyle(midiValue + 1, midiValueSequence, colors, canShowSolutionRef, answerMidiValueSequence, exerciseType)}
        />
    </div>
  );
}

const keyProps = {
  canShowSolutionRef: PropTypes.object,
  colors: PropTypes.object.isRequired,
  exerciseType: PropTypes.string,
  answerMidiValueSequence: PropTypes.array,
  midiValue: PropTypes.number,
  midiValueSequence: PropTypes.array,
  updateKeyRangeSelection: PropTypes.func
};

const defaultKeyProps = {
  canShowSolutionRef: {},
  exerciseType: '',
  answerMidiValueSequence: [],
  midiValue: null,
  midiValueSequence: [],
  updateKeyRangeSelection: () => {}
};

KeyWhite.propTypes = {
  ...keyProps
};

KeyWhite.defaultKeyProps = {
  ...defaultKeyProps
};

KeyWhiteWithBlack.propTypes = {
  ...keyProps
};

KeyWhiteWithBlack.defaultKeyProps = {
  ...defaultKeyProps
};
