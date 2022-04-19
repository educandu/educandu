import { Button } from 'antd';
import { Piano } from 'react-piano';
import { RadialChart } from 'react-vis';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SoundfontProvider from './soundfont-provider.js';
import { shuffleItems } from '../../utils/array-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import DimensionsProvider from '../../components/dimensions-provider.js';
import AudioContextProvider from '../../common/audio-context-provider.js';

const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';

const TEST_STATE = {
  yellow: 'TestStateYellow',
  green: 'TestStateGreen',
  red: 'TestStateRed'
};

const pushIfNotLast = (arr, value) => {
  return arr[arr.length - 1] === value
    ? [...arr]
    : [...arr, value];
};

function IntervalTrainerDisplay({ content }) {
  const { t } = useTranslation('intervalTrainer');

  const audioContextProvider = useService(AudioContextProvider);
  const audioContext = audioContextProvider.getAudioContext();

  const createTestStateFromProps = shuffle => {
    return (shuffle ? shuffleItems(content.tests) : content.tests).map(test => ({
      ...test,
      inputs: [],
      cancelled: false,
      state: TEST_STATE.yellow
    }));
  };

  const [tests, setTests] = useState(createTestStateFromProps(false));
  const [showStats, setShowStats] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);

  const keyboardShortcuts = [].slice.call(content.keyboardShortcuts).map((k, i) => ({
    midiNumber: i + content.keyboardOffset,
    key: k
  }));

  const handlePlayNoteInput = midiNumber => {
    const originalTest = tests[currentTestIndex];

    if (originalTest.state === TEST_STATE.green || originalTest.cancelled) {
      return;
    }

    const normalizedMidiNumber = midiNumber - content.keyboardOffset;

    const updatedTest = {
      ...originalTest,
      inputs: pushIfNotLast(originalTest.inputs, normalizedMidiNumber)
    };

    if (updatedTest.inputs.length && updatedTest.inputs.length % 2 === 0) {
      const correctValues = updatedTest.interval;
      const inputValuesUnordered = updatedTest.inputs.slice(-2);
      let inputValues;
      if (correctValues[0] < correctValues[1]) {
        inputValues = [Math.min(...inputValuesUnordered), Math.max(...inputValuesUnordered)];
      } else {
        inputValues = [Math.max(...inputValuesUnordered), Math.min(...inputValuesUnordered)];
      }

      const offset1 = correctValues[0] - inputValues[0];
      const offset2 = correctValues[1] - inputValues[1];
      updatedTest.state = offset1 % 12 === 0 && offset1 === offset2
        ? TEST_STATE.green
        : TEST_STATE.red;

    } else {
      updatedTest.state = TEST_STATE.yellow;
    }

    setTests(tests.map((test, i) => i === currentTestIndex ? updatedTest : test));
  };

  const handleNextClick = () => {
    setCurrentTestIndex(prevIndex => prevIndex + 1);
  };

  const handleResolveClick = () => {
    const originalTest = tests[currentTestIndex];
    const updatedTest = { ...originalTest, cancelled: true, state: TEST_STATE.green };
    setTests(tests.map((test, i) => i === currentTestIndex ? updatedTest : test));
  };

  const handleStatsClick = () => {
    setShowStats(true);
  };

  const handleResetClick = () => {
    setTests(createTestStateFromProps(true));
  };

  const renderNoteLabel = ({ keyboardShortcut, midiNumber, isAccidental }) => {
    const test = tests[currentTestIndex];

    let userInputs;
    if (test.cancelled) {
      userInputs = test.interval.slice();
    } else if (test.inputs.length) {
      userInputs = test.inputs.slice(test.inputs.length % 2 === 0 ? -2 : -1);
    } else {
      userInputs = [];
    }

    const normalizedMidiNumber = midiNumber - content.keyboardOffset;
    const isUserSelectedNote = userInputs.includes(normalizedMidiNumber);

    const dotClasses = ['IntervalTrainer-keyLabelDot'];

    if (isUserSelectedNote) {
      switch (test.state) {
        case TEST_STATE.yellow:
          dotClasses.push('IntervalTrainer-keyLabelDot--yellow');
          break;
        case TEST_STATE.green:
          dotClasses.push('IntervalTrainer-keyLabelDot--green');
          break;
        case TEST_STATE.red:
          dotClasses.push('IntervalTrainer-keyLabelDot--red');
          break;
        default:
          throw new Error('Invalid test state');
      }
    }

    const containerClassName = isAccidental ? 'IntervalTrainer-keyLabel IntervalTrainer-keyLabel--accidental' : 'IntervalTrainer-keyLabel';

    return (
      <div className={containerClassName}>
        <div className={dotClasses.join(' ')} />
        <div className="IntervalTrainer-keyLabelShortcut">{(keyboardShortcut || '').toUpperCase()}</div>
      </div>
    );
  };

  const renderStatElement = () => {
    const results = tests.reduce((stats, test) => {
      if (test.cancelled) {
        stats.failures += 1;
      } else if (test.inputs.length > 2) {
        stats.multipleAttemptSuccesses += 1;
      } else {
        stats.oneAttemptSuccesses += 1;
      }

      return stats;
    }, { oneAttemptSuccesses: 0, multipleAttemptSuccesses: 0, failures: 0 });

    const data = [
      {
        value: results.oneAttemptSuccesses,
        label: t('oneAttemptSuccesses'),
        pieItemClassName: 'IntervalTrainer-pieItem IntervalTrainer-pieItem--green',
        squareClassName: 'IntervalTrainer-legendSquare IntervalTrainer-legendSquare--green'
      }, {
        value: results.multipleAttemptSuccesses,
        label: t('multipleAttemptSuccesses'),
        pieItemClassName: 'IntervalTrainer-pieItem IntervalTrainer-pieItem--yellow',
        squareClassName: 'IntervalTrainer-legendSquare IntervalTrainer-legendSquare--yellow'
      }, {
        value: results.failures,
        label: t('failures'),
        pieItemClassName: 'IntervalTrainer-pieItem IntervalTrainer-pieItem--red',
        squareClassName: 'IntervalTrainer-legendSquare IntervalTrainer-legendSquare--red'
      }
    ].filter(d => d.value);

    return (
      <div className="IntervalTrainer-stats">
        <div className="IntervalTrainer-chart">
          <RadialChart
            data={data.map(d => ({ angle: d.value, className: d.pieItemClassName }))}
            colorType="literal"
            width={300}
            height={300}
            animation
            />
          <div className="IntervalTrainer-legend">
            {data.map((d, i) => (
              <div className="IntervalTrainer-legendItem" key={`legend-item-${i.toString()}`}>
                <div className={d.squareClassName} />
                <div className="IntervalTrainer-legendLabel">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionElement = () => {
    return (
      <div className="IntervalTrainer-question">
        <span>{t('taskNumber', { number: currentTestIndex + 1 })}:</span>
        <br />
        <i>{tests[currentTestIndex].question}</i>
      </div>
    );
  };

  const renderKeyboardElement = () => {
    const noteRange = {
      first: content.keyboardStart + content.keyboardOffset,
      last: content.keyboardEnd + content.keyboardOffset
    };

    return (
      <DimensionsProvider>
        {({ containerWidth }) => (
          <SoundfontProvider
            instrumentName="acoustic_grand_piano"
            audioContext={audioContext}
            hostname={soundfontHostname}
            offset={content.keyboardOffset || 0}
            render={({ isLoading, playNote, stopNote }) => (
              <Piano
                noteRange={noteRange}
                width={containerWidth}
                playNote={playNote}
                stopNote={stopNote}
                disabled={isLoading}
                keyboardShortcuts={keyboardShortcuts}
                renderNoteLabel={renderNoteLabel}
                onPlayNoteInput={handlePlayNoteInput}
                />
            )}
            />
        )}
      </DimensionsProvider>
    );
  };

  const currentTest = tests[currentTestIndex];
  if (!currentTest) {
    return (
      <div className="IntervalTrainer">
        {t('noTests')}
      </div>
    );
  }

  const showResolveButton = currentTest.state !== TEST_STATE.green;
  const showNextButton = currentTest.state === TEST_STATE.green && currentTestIndex < tests.length - 1;
  const showStatsButton = currentTest.state === TEST_STATE.green && currentTestIndex === tests.length - 1 && !showStats;

  return (
    <div className="IntervalTrainer">
      <h2 className="IntervalTrainer-header">{content.title}</h2>
      {!showStats && renderQuestionElement()}
      {!showStats && renderKeyboardElement()}
      {showStats && renderStatElement()}
      <div className="IntervalTrainer-footer">
        {showNextButton && <Button type="ghost" onClick={handleNextClick}>{t('next')}</Button>}
        {showResolveButton && <Button type="ghost" onClick={handleResolveClick}>{t('solve')}</Button>}
        {showStatsButton && <Button type="ghost" onClick={handleStatsClick}>{t('statistics')}</Button>}
        {showStats && <Button type="ghost" onClick={handleResetClick}>{t('restart')}</Button>}
      </div>
    </div>
  );
}

IntervalTrainerDisplay.propTypes = {
  ...sectionDisplayProps
};

export default IntervalTrainerDisplay;
