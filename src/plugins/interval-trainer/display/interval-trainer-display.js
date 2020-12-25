const React = require('react');
const { Button } = require('antd');
const autoBind = require('auto-bind');
const PropTypes = require('prop-types');
const { Piano } = require('react-piano');
const { RadialChart } = require('react-vis');
const arrayShuffle = require('array-shuffle');
const SoundfontProvider = require('./soundfont-provider');
const DimensionsProvider = require('./dimensions-provider');
const { inject } = require('../../../components/container-context');
const { sectionDisplayProps } = require('../../../ui/default-prop-types');
const AudioContextProvider = require('../../../common/audio-context-provider');

const soundfontHostname = 'https://d1pzp51pvbm36p.cloudfront.net';

const TEST_STATE_YELLOW = 'TestStateYellow';
const TEST_STATE_GREEN = 'TestStateGreen';
const TEST_STATE_RED = 'TestStateRed';

const pushIfNotLast = (arr, value) => {
  return arr[arr.length - 1] === value
    ? [...arr]
    : [...arr, value];
};

class IntervalTrainerDisplay extends React.Component {
  constructor(props) {
    super(props);

    autoBind(this);

    this.audioContext = props.audioContextProvider.getAudioContext();

    this.state = {
      ...this.createTestStateFromProps(props, false),
      keyboardShortcuts: [].slice.call(props.content.keyboardShortcuts).map((k, i) => ({
        midiNumber: i + this.props.content.keyboardOffset,
        key: k
      }))
    };
  }

  createTestStateFromProps(props, shuffle) {
    const { tests } = props.content;
    return {
      tests: (shuffle ? arrayShuffle(tests) : tests).map(test => ({
        ...test,
        inputs: [],
        cancelled: false,
        state: TEST_STATE_YELLOW
      })),
      currentTestIndex: 0,
      showStats: false
    };
  }

  handlePlayNoteInput(midiNumber) {
    const { tests, currentTestIndex } = this.state;
    const originalTest = tests[currentTestIndex];

    if (originalTest.state === TEST_STATE_GREEN || originalTest.cancelled) {
      return;
    }

    const { content } = this.props;
    const { keyboardOffset } = content;
    const normalizedMidiNumber = midiNumber - keyboardOffset;

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
        ? TEST_STATE_GREEN
        : TEST_STATE_RED;

    } else {
      updatedTest.state = TEST_STATE_YELLOW;
    }

    this.setState({ tests: tests.map((t, i) => i === currentTestIndex ? updatedTest : t) });
  }

  handleNextClick() {
    this.setState(prevState => ({ currentTestIndex: prevState.currentTestIndex + 1 }));
  }

  handleResolveClick() {
    const { tests, currentTestIndex } = this.state;
    const originalTest = tests[currentTestIndex];
    const updatedTest = { ...originalTest, cancelled: true, state: TEST_STATE_GREEN };
    this.setState({ tests: tests.map((t, i) => i === currentTestIndex ? updatedTest : t) });
  }

  handleStatsClick() {
    this.setState({ showStats: true });
  }

  handleResetClick() {
    this.setState(this.createTestStateFromProps(this.props, true));
  }

  renderNoteLabel({ keyboardShortcut, midiNumber, isAccidental }) {
    const { content } = this.props;
    const { tests, currentTestIndex } = this.state;

    const test = tests[currentTestIndex];

    let userInputs;
    if (test.cancelled) {
      userInputs = test.interval.slice();
    } else if (test.inputs.length) {
      userInputs = test.inputs.slice(test.inputs.length % 2 === 0 ? -2 : -1);
    } else {
      userInputs = [];
    }

    const { keyboardOffset } = content;
    const normalizedMidiNumber = midiNumber - keyboardOffset;
    const isUserSelectedNote = userInputs.includes(normalizedMidiNumber);

    const dotClasses = ['IntervalTrainer-keyLabelDot'];

    if (isUserSelectedNote) {
      switch (test.state) {
        case TEST_STATE_YELLOW:
          dotClasses.push('IntervalTrainer-keyLabelDot--yellow');
          break;
        case TEST_STATE_GREEN:
          dotClasses.push('IntervalTrainer-keyLabelDot--green');
          break;
        case TEST_STATE_RED:
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
  }

  renderStatElement(tests) {
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
        label: 'Aufgaben gelöst nach nur einem Versuch',
        pieItemClassName: 'IntervalTrainer-pieItem IntervalTrainer-pieItem--green',
        squareClassName: 'IntervalTrainer-legendSquare IntervalTrainer-legendSquare--green'
      }, {
        value: results.multipleAttemptSuccesses,
        label: 'Aufgaben gelöst nach mehreren Versuchen',
        pieItemClassName: 'IntervalTrainer-pieItem IntervalTrainer-pieItem--yellow',
        squareClassName: 'IntervalTrainer-legendSquare IntervalTrainer-legendSquare--yellow'
      }, {
        value: results.failures,
        label: 'Nicht gelöste Aufgaben',
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
  }

  renderQuestionElement(currentTestIndex, currentTest) {
    return (
      <div className="IntervalTrainer-question">
        <span>Aufgabe&nbsp;{currentTestIndex + 1}:</span>
        <br />
        <i>{currentTest.question}</i>
      </div>
    );
  }

  renderKeyboardElement(keyboardStart, keyboardEnd, keyboardOffset, keyboardShortcuts) {
    const noteRange = {
      first: keyboardStart + keyboardOffset,
      last: keyboardEnd + keyboardOffset
    };

    return (
      <DimensionsProvider>
        {({ containerWidth }) => (
          <SoundfontProvider
            instrumentName="acoustic_grand_piano"
            audioContext={this.audioContext}
            hostname={soundfontHostname}
            offset={keyboardOffset || 0}
            render={({ isLoading, playNote, stopNote }) => (
              <Piano
                noteRange={noteRange}
                width={containerWidth}
                playNote={playNote}
                stopNote={stopNote}
                disabled={isLoading}
                keyboardShortcuts={keyboardShortcuts}
                renderNoteLabel={this.renderNoteLabel}
                onPlayNoteInput={this.handlePlayNoteInput}
                />
            )}
            />
        )}
      </DimensionsProvider>
    );
  }

  render() {
    const { tests, showStats, currentTestIndex, keyboardShortcuts } = this.state;
    const { content } = this.props;
    const { keyboardStart, keyboardEnd, keyboardOffset, title } = content;

    const test = tests[currentTestIndex];
    if (!test) {
      return (
        <div className="IntervalTrainer">
          Keine Tests vorhanden
        </div>
      );
    }

    const showResolveButton = test.state !== TEST_STATE_GREEN;
    const showNextButton = test.state === TEST_STATE_GREEN && currentTestIndex < tests.length - 1;
    const showStatsButton = test.state === TEST_STATE_GREEN && currentTestIndex === tests.length - 1 && !showStats;

    return (
      <div className="IntervalTrainer">
        <h2 className="IntervalTrainer-header">{title}</h2>
        {!showStats && this.renderQuestionElement(currentTestIndex, test)}
        {!showStats && this.renderKeyboardElement(keyboardStart, keyboardEnd, keyboardOffset, keyboardShortcuts)}
        {showStats && this.renderStatElement(tests)}
        <div className="IntervalTrainer-footer">
          {showNextButton && <Button type="ghost" onClick={this.handleNextClick}>weiter</Button>}
          {showResolveButton && <Button type="ghost" onClick={this.handleResolveClick}>auflösen</Button>}
          {showStatsButton && <Button type="ghost" onClick={this.handleStatsClick}>Auswertung</Button>}
          {showStats && <Button type="ghost" onClick={this.handleResetClick}>Nochmal üben</Button>}
        </div>
      </div>
    );
  }
}

IntervalTrainerDisplay.propTypes = {
  ...sectionDisplayProps,
  audioContextProvider: PropTypes.instanceOf(AudioContextProvider).isRequired
};

module.exports = inject({
  audioContextProvider: AudioContextProvider
}, IntervalTrainerDisplay);
