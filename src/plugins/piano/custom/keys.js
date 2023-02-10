import React from 'react';
import PropTypes from 'prop-types';
import { EXERCISE_TYPES } from './constants.js';

const getStyle = (keyMidiValue, midiValueSequence, colors, answerMidiValueSequence, exerciseType, canShowSolution) => {

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

  if (isSolutionKey && canShowSolution) {
    style.backgroundColor = colors.correct;
  }
  if (isAnswerKey && !canShowSolution) {
    style.backgroundColor = colors.answer;
  }
  if (isAnswerKey && !isSolutionKey && canShowSolution) {
    style.backgroundColor = colors.wrong;
  }
  if (isIndicationKey) {
    style.backgroundColor = colors.activeKey;
    if (exerciseType === EXERCISE_TYPES.interval && midiValueSequence[0] === midiValueSequence[1] && canShowSolution) {
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
    canShowSolution,
    midiValueSequence,
    updateKeyRangeSelection,
    answerMidiValueSequence } = props;

  return (
    <div
      className="Piano-key Piano-keyWhite"
      onClick={updateKeyRangeSelection}
      data-midi-value={midiValue}
      data-default-color={colors.whiteKey}
      data-index={index}
      style={getStyle(midiValue, midiValueSequence, colors, answerMidiValueSequence, exerciseType, canShowSolution)}
      />
  );
}

export function KeyWhiteWithBlack(props) {

  const { index,
    colors,
    midiValue,
    exerciseType,
    midiValueSequence,
    canShowSolution,
    updateKeyRangeSelection,
    answerMidiValueSequence } = props;

  return (
    <div
      className="Piano-key Piano-keyWhite"
      onClick={updateKeyRangeSelection}
      data-midi-value={midiValue}
      data-default-color={colors.whiteKey}
      data-index={index}
      style={getStyle(midiValue, midiValueSequence, colors, answerMidiValueSequence, exerciseType, canShowSolution)}
      >
      <div
        className="Piano-key Piano-keyBlack"
        data-midi-value={midiValue + 1}
        data-default-color={colors.blackKey}
        style={getStyle(midiValue + 1, midiValueSequence, colors, answerMidiValueSequence, exerciseType, canShowSolution)}
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
