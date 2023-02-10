/* eslint-disable max-lines */
import Piano from './custom/piano.js';
import * as ut from './custom/utils.js';
import * as C from './custom/constants.js';
import StopIcon from './icons/stop-icon.js';
import CustomSwitch from './custom/switch.js';
import { useTranslation } from 'react-i18next';
import BackspaceIcon from './icons/backspace-icon.js';
import { Button, Radio, InputNumber, Slider } from 'antd';
import AbcNotation from '../../components/abc-notation.js';
import React, { useEffect, useRef, useState } from 'react';
import ClientConfig from '../../bootstrap/client-config.js';
import CardSelector from '../../components/card-selector.js';
import { getAccessibleUrl } from '../../utils/source-utils.js';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PlayIcon from '../../components/icons/media-player/play-icon.js';
import PauseIcon from '../../components/icons/media-player/pause-icon.js';
import { useMidiData, usePianoId, useToneJsSampler, useMidiDevice, useExercise, useMidiPlayer } from './custom/hooks.js';

export default function PianoDisplay({ content }) {

  const keys = useRef(null);
  const activeNotes = useRef([]);
  const RadioGroup = Radio.Group;
  const RadioButton = Radio.Button;
  const noteDurationRef = useRef(2000);
  const { t } = useTranslation('piano');
  const isMidiInputEnabled = useRef(false);
  const isNoteInputEnabled = useRef(false);
  const isExercisePlayingRef = useRef(false);
  const playExerciseMode = useRef('successive');
  const clientConfig = useService(ClientConfig);
  const [playExerciseStartIndex, setPlayExerciseStartIndex] = useState(0);
  const { sourceUrl, midiTrackTitle, colors, tests, sampleType } = content;
  const src = getAccessibleUrl({ url: sourceUrl, cdnRootUrl: clientConfig.cdnRootUrl });

  const [canShowSolution, setCanShowSolution] = useState(false);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Custom hooks returning state/ref variables
  const midiData = useMidiData(src); // state
  const pianoId = usePianoId('default'); // state
  const isMidiDeviceConnected = useMidiDevice(); // state
  const [midiPlayer, midiPlayerHandler] = useMidiPlayer(midiData); // [ref, ref]
  const [sampler, hasSamplerLoaded] = useToneJsSampler(sampleType); // [ref, state]
  const exerciseData = useExercise(content, currentTestIndex, currentExerciseIndex); // state

  const {
    clef,
    keyRange,
    solution,
    indication,
    chordVector,
    indicationMidiValue
  } = exerciseData ? exerciseData : {};

  const chord = C.CHORD_VECTOR_MAP.get(JSON.stringify(chordVector));

  const answerAbcNoteNameSequenceRef = useRef([]);
  const [answerAbc, setAnswerAbc] = useState('');
  const [answerMidiValueSequence, setAnswerMidiValueSequence] = useState([]);

  const currentTest = (() => tests[currentTestIndex] ? tests[currentTestIndex] : {})();
  const { exerciseType, customNoteSequences } = currentTest;

  const testCards = tests.map((test, index) => ({ label: (index + 1).toString(), tooltip: t('testNumber', { number: index + 1 }) }));

  const getEventTypeFromMidiCommand = (command, velocity) => {
    switch (command) {
      case C.MIDI_COMMANDS.noteOn:
        if (velocity > 0) {
          return C.EVENT_TYPES.noteOn;
        }
        return C.EVENT_TYPES.noteOff;
      case C.MIDI_COMMANDS.noteOff:
        return C.EVENT_TYPES.noteOff;
      default:
        return '';
    }
  };

  // Keep track of active notes for midi player events as well as midi device and mouse input
  const updateActiveNotes = (eventType, midiValue) => {
    const arr = activeNotes.current;
    const index = arr.indexOf(midiValue);
    if (eventType === 'Note on') {
      if (index === -1) {
        arr.push(midiValue);
      }
    }
    if (eventType === 'Note off') {
      if (index !== -1) {
        arr.splice(index, 1);
      }
    }
    if (eventType === 'Reset') {
      arr.length = 0;
    }
  };

  function playOrStopNote(eventType, noteName) {

    switch (eventType) {
      case 'Note on':
        sampler.current.triggerAttack(noteName);
        break;
      case 'Note off':
        sampler.current.triggerRelease(noteName);
        break;
      default:
        break;
    }
  }

  const playExercise = async () => {
    if (isExercisePlayingRef.current) {
      return;
    }
    isExercisePlayingRef.current = true;
    const midiNoteNameSequence = exerciseData.midiNoteNameSequence;
    if (exerciseType !== C.EXERCISE_TYPES.noteSequence && playExerciseMode.current === 'simultaneous') {
      await ut.playNotesSimultaneously(sampler.current, midiNoteNameSequence, noteDurationRef, isExercisePlayingRef);
      return;
    }

    ut.playNotesSuccessively(sampler.current, midiNoteNameSequence, noteDurationRef, isExercisePlayingRef, playExerciseStartIndex);
  };

  const resetEarTrainingControls = params => {
    setAnswerAbc('');
    setCanShowSolution(false);
    setPlayExerciseStartIndex(0);
    isExercisePlayingRef.current = false;
    answerAbcNoteNameSequenceRef.current.length = 0;
    setAnswerMidiValueSequence([]);

    if (params.changeTest) {
      setCurrentExerciseIndex(0);
      return;
    }

    if (ut.isCustomNoteSequenceExercise(currentTest) && customNoteSequences.length - 1 < currentExerciseIndex + 1) {
      setCurrentExerciseIndex(0);
      return;
    }
    setCurrentExerciseIndex(prev => prev + 1);
  };

  const resetAllKeyStyles = () => {
    const midiValueSequence = exerciseData.midiValueSequence;
    for (const key of keys.current) {
      if (typeof key !== 'undefined' && !midiValueSequence?.includes(parseInt(key.dataset.midiValue, 10))) {
        key.style.backgroundColor = key.dataset.defaultColor;
      }
    }
  };

  const updateKeyStyle = (eventType, midiValue) => {
    const key = keys.current[midiValue];
    if (typeof key === 'undefined' || (!ut.isNoteSequenceExercise(currentTest) && isNoteInputEnabled.current)) {
      return;
    }

    if (eventType === C.EVENT_TYPES.noteOn) {
      key.style.backgroundColor = colors.activeKey;
    }
    if (eventType === C.EVENT_TYPES.noteOff && midiValue !== indicationMidiValue) {
      key.style.backgroundColor = key.dataset.defaultColor;
    }
    if (eventType === C.EVENT_TYPES.toggle) {
      key.style.backgroundColor = key.style.backgroundColor === colors.activeKey ? key.dataset.defaultColor : colors.activeKey;
    }
  };

  const updateAnswerAbc = () => {
    setAnswerAbc(() => {
      let inputString = '';
      for (const abcNoteName of answerAbcNoteNameSequenceRef.current) {
        inputString += abcNoteName;
      }
      return inputString;
    });
  };

  const inputNote = midiValue => {

    const midiValueSequence = exerciseData.midiValueSequence;
    const abcNoteNameSequence = exerciseData.abcNoteNameSequence;

    if (canShowSolution || ut.isKeyOutOfRange(keyRange, midiValue)) {
      return;
    }

    // Don't allow to input more notes than needed. Max note input number is number of solution notes - 1: First note (indication) can not be input or deleted
    const isAnswerComplete = ut.isAnswerComplete({
      test: currentTest,
      answerMidiValueSequence,
      midiValueSequence,
      answerAbcNoteNameSequenceRef,
      abcNoteNameSequence
    });

    if (!ut.isNoteSequenceExercise(currentTest)) {

      // Toggle answer key
      if (answerMidiValueSequence.includes(midiValue)) {
        setAnswerMidiValueSequence(prev => {
          const arr = [...prev];
          const index = arr.indexOf(midiValue);
          arr.splice(index, 1);
          return arr;
        });
      } else if (!isAnswerComplete) {
        setAnswerMidiValueSequence(prev => {
          const arr = [...prev];
          arr.push(midiValue);
          return arr;
        });
      } else {
        return;
      }
    }

    // ___Note sequence mode only from here___

    if (isAnswerComplete) {
      return;
    }
    const autoAbcNoteName = C.ABC_NOTE_NAMES[midiValue];
    const solutionAbcNoteName = abcNoteNameSequence[answerAbcNoteNameSequenceRef.current.length + 1];
    const solutionMidiValue = midiValueSequence[answerAbcNoteNameSequenceRef.current.length + 1];
    const isCorrect = midiValue === solutionMidiValue;

    // Make sure same accidental type note is rendered for chromatic notes as in solution
    answerAbcNoteNameSequenceRef.current.push(isCorrect ? solutionAbcNoteName : autoAbcNoteName);

    updateAnswerAbc();
  };

  const deleteNote = () => {
    answerAbcNoteNameSequenceRef.current.pop();
    updateAnswerAbc();
  };

  function handleMidiDeviceEvent(message) {

    // Midi input !== note input
    if (!isMidiInputEnabled.current) {
      return;
    }
    const midiValue = message.data[1];
    const noteName = ut.getNoteNameFromMidiValue(midiValue);
    const command = message.data[0];
    const velocity = message.data.length > 2 ? message.data[2] : 0;
    const eventType = getEventTypeFromMidiCommand(command, velocity);

    updateActiveNotes(eventType, midiValue);
    playOrStopNote(eventType, noteName);
    updateKeyStyle(eventType, midiValue);

    if (isNoteInputEnabled.current && eventType === C.EVENT_TYPES.noteOn) {
      inputNote(midiValue);
    }
  }

  const updateMidiMessageHandlers = () => {
    if (isMidiDeviceConnected) {
      for (const input of document.midiAccessObj.inputs.values()) {
        input.onmidimessage = handleMidiDeviceEvent;
      }
    }
  };

  function handleMidiPlayerEvent(message) {
    if (!['Note on', 'Note off'].includes(message.name)) {
      return;
    }
    const midiValue = message.noteNumber;
    const velocity = message.velocity;
    const noteName = message.noteName;
    let eventType;
    if (message.name === 'Note on') {
      eventType = velocity <= 0 ? C.EVENT_TYPES.noteOff : C.EVENT_TYPES.noteOn;
    }
    if (message.name === 'Note off') {
      eventType = C.EVENT_TYPES.noteOff;
    }

    playOrStopNote(eventType, noteName);
    updateKeyStyle(eventType, midiValue);
    updateActiveNotes(eventType, midiValue);
  }

  const startMidiPlayer = () => {
    if (!midiPlayer.current.isPlaying()) {
      midiPlayer.current.play();
    }
  };

  const pauseMidiPlayer = () => {
    if (!midiPlayer.current) {
      return;
    }
    if (!midiPlayer.current.isPlaying()) {
      return;
    }
    midiPlayer.current.pause();
    sampler.current.releaseAll();
  };

  const stopMidiPlayer = () => {
    if (midiPlayer.current) {
      midiPlayer.current.stop();
    }
    sampler.current.releaseAll();
    resetAllKeyStyles();
    updateActiveNotes('Reset');
  };

  // Stored in browser document object to be called from sibling pianos
  // Disable MIDI device input when sibling piano midi input switch is set active
  const disableMidiInput = id => {
    // Prevent piano from disabling itself
    if (id === pianoId) {
      return;
    }
    isMidiInputEnabled.current = false;
    const switchElem = document.querySelector(`.${pianoId}.Piano-switch`);
    if (switchElem && switchElem.classList.contains('Piano-switchChecked')) {
      switchElem.classList.remove('Piano-switchChecked');
    }
    resetAllKeyStyles();
  };

  // Disable midi input for sibling pianos when midi input switch is activated
  const manageSiblingPianosMidiInput = () => {

    if (pianoId === 'default' || !isMidiDeviceConnected || !isMidiInputEnabled.current) {
      return;
    }

    if (typeof document.midiPianos === 'undefined') {
      document.midiPianos = [];
      document.midiPianoIds = [];
    }

    // Check if midi pianos have been deleted
    document.midiPianos = document.midiPianos.filter(piano => !!document.querySelector(`#${piano.id}`));
    document.midiPianoIds = [];
    document.midiPianos.forEach(piano => {
      document.midiPianoIds.push(piano.id);
    });

    document.midiPianoIds = document.midiPianoIds.filter(id => id !== pianoId);
    document.midiPianos = document.midiPianos.filter(piano => piano.id !== pianoId);

    document.midiPianoIds.push(pianoId);
    document.midiPianos.push({
      id: pianoId,
      disableMidiInput
    });

    for (const piano of document.midiPianos) {
      piano.disableMidiInput(pianoId);
    }
  };

  const handleSwitchClick = isChecked => {
    isMidiInputEnabled.current = isChecked;
    updateActiveNotes('Reset');
    updateMidiMessageHandlers();
    manageSiblingPianosMidiInput();
  };

  const handleTestCardSelected = testIndex => {
    if (currentTestIndex !== testIndex) {
      setCurrentTestIndex(testIndex);
      resetEarTrainingControls({ changeTest: true });
    }
  };

  const renderMidiPlayerControls = () => (
    <div className="Piano-midiPlayerControls" >
      <Button onClick={startMidiPlayer} icon={<PlayIcon />} />
      <Button onClick={pauseMidiPlayer} icon={<PauseIcon />} />
      <Button onClick={stopMidiPlayer} icon={<StopIcon />} />
    </div>
  );

  const renderMidiInputSwitch = () => (
    <div className="Piano-midiInputSwitchContainer">
      <div>{t('midiInput')}</div>
      <CustomSwitch handleSwitchClick={handleSwitchClick} pianoId={pianoId} />
    </div>
  );

  const renderMidiTrackTitle = () => (
    <div className="Piano-midiTrackTitle">{midiTrackTitle}</div>
  );

  const renderPlayExerciseModeRadioGroup = () => (
    <div className="Piano-playExerciseModeRGContainer">
      <RadioGroup defaultValue="successive" className="Piano-playExerciseModeRG">
        <RadioButton className="Piano-btnPlayExerciseMode" value="successive" onChange={() => { playExerciseMode.current = 'successive'; }}>{t('successive')}</RadioButton>
        <RadioButton className="Piano-btnPlayExerciseMode" value="simultaneous" onChange={() => { playExerciseMode.current = 'simultaneous'; }}>{t('simultaneous')}</RadioButton>
      </RadioGroup>
    </div>
  );

  const renderNoteSequenceControls = () => {
    return (
      <div className="Piano-playFromNoteInputContainer">
        <div className="Piano-controlsLabel">{`${t('playFromNote')}:`}</div>
        <InputNumber
          className="Piano-playFromNoteInput"
          value={playExerciseStartIndex + 1}
          min={1}
          max={exerciseData.abcNoteNameSequence.length}
          onChange={value => { setPlayExerciseStartIndex(value - 1); }}
          />
      </div>
    );
  };

  const formatter = value => `${(value / 1000).toFixed(1)}s`;

  const renderEarTrainingControls = test => (
    <div className="Piano-earTrainingControls">
      <div className="Piano-earTrainingHeadline">
        <h5 className="Piano-headlineEarTraining">{`${t('earTraining')}: ${t(exerciseType)} ${ut.usesWhiteKeysOnly(currentTest) ? `(${t('whiteKeysOnly')})` : ''}`}</h5>
      </div>
      <div className="Piano-earTrainingControlsItem">
        <Button onClick={playExercise} icon={<PlayIcon />} />
        <Button onClick={() => { isExercisePlayingRef.current = false; }} icon={<StopIcon />} />
      </div>
      <div className="Piano-earTrainingControlsBody">
        <div className="Piano-noteDurationControlsItem">
          <div className="Piano-controlsLabel">{`${t('noteDuration')}:`}</div>
          <div className="Piano-noteDurationSlider">
            <Slider tooltip={{ formatter }} defaultValue={2000} min={200} max={4000} step={100} onChange={value => { noteDurationRef.current = value; }} />
          </div>
        </div>
        {ut.isNoteSequenceExercise(test) && renderNoteSequenceControls()}
        {!ut.isNoteSequenceExercise(test) && renderPlayExerciseModeRadioGroup()}
        <div className="Piano-exerciseBtns">
          <Button
            className="Piano-btnShowHideSolution"
            onClick={() => {
              setCanShowSolution(prev => !prev);
            }}
            >
            {canShowSolution ? t('hideSolution') : t('showSolution')}
          </Button>
          <Button className="Piano-btnNewExercise" onClick={resetEarTrainingControls}>{t('newExercise')}</Button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (isMidiInputEnabled.current) {
      updateMidiMessageHandlers();
    }
    manageSiblingPianosMidiInput();
  });

  // Set event handlers for midiPlayer
  useEffect(() => {
    midiPlayerHandler.current.updateActiveNotes = updateActiveNotes;
    midiPlayerHandler.current.handleMidiPlayerEvent = handleMidiPlayerEvent;
    midiPlayerHandler.current.resetAllKeyStyles = resetAllKeyStyles;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return function cleanUp() {
      if (midiPlayer.current && hasSamplerLoaded && sampler) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        midiPlayer.current.stop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        sampler.current.releaseAll();
      }
    };
  });

  useEffect(() => {
    if (isMidiDeviceConnected) {
      for (const input of document.midiAccessObj.inputs.values()) {
        input.onmidimessage = null;
      }
    }
  }, [isMidiDeviceConnected]);

  return (
    <React.Fragment>
      {testCards.length > 1 && (
        <div className="EarTrainingDisplay-controlPanel Piano-cardSelector">
          <div>
            <CardSelector
              cards={testCards}
              onCardSelected={handleTestCardSelected}
              selectedCardIndex={currentTestIndex}
              treatSelectedCardAsVisited
              />
          </div>
        </div>
      )}
      <div className="Piano-abcDisplayContainer">
        {ut.isNoteSequenceExercise(currentTest) && (
          <div className="AbcNotation Piano-flex">
            <div className="AbcNotation-wrapper u-width-65 Piano-answerAbcDisplay">
              <div className="Piano-noteInputSwitch">
                <CustomSwitch handleSwitchClick={isChecked => { isNoteInputEnabled.current = isChecked; }} isNoteInputEnabled={isNoteInputEnabled} />
                <div>{t('noteInput')}</div>
              </div>
              <div className="Piano-answerAbcNotation">
                <AbcNotation abcCode={`L:1/4 \n K:C ${clef} \n ${indication + answerAbc}`} />
              </div>
              <Button onClick={deleteNote} icon={<BackspaceIcon />} className="Piano-btnDeleteNote" />
            </div>
            <div className="AbcNotation-wrapper u-width-65 Piano-solutionAbcDisplay">
              <div>{canShowSolution ? t('solution') : t('firstNote')}</div>
              <div className="Piano-solutionAbcNotation">
                <AbcNotation abcCode={`L:1/4 \n K:C ${clef} \n ${canShowSolution ? solution : indication}`} />
              </div>
            </div>
          </div>
        )}
      </div>
      {[C.EXERCISE_TYPES.interval, C.EXERCISE_TYPES.chord].includes(exerciseType) && (
        <div className="Piano-threeFlexColumnsContainer">
          <div className="Piano-oneOfThreeFlexColumns">
            <div className="Piano-switchContainer">
              <CustomSwitch handleSwitchClick={isChecked => { isNoteInputEnabled.current = isChecked; }} isNoteInputEnabled={isNoteInputEnabled} />
              <div>{t('noteInput')}</div>
            </div>
          </div>
          <div className="Piano-chordSolutionDisplay">
            {!!canShowSolution && exerciseType === C.EXERCISE_TYPES.chord && <div>{`${t(chord.type)}, ${t(chord.inversion)}`}</div>}
          </div>
          <div className="Piano-oneOfThreeFlexColumns">
            <div />
          </div>
        </div>
      )}
      <Piano
        keys={keys}
        colors={colors}
        content={content}
        pianoId={pianoId}
        sampler={sampler}
        test={currentTest}
        inputNote={inputNote}
        activeNotes={activeNotes}
        exerciseData={exerciseData}
        updateKeyStyle={updateKeyStyle}
        canShowSolution={canShowSolution}
        hasSamplerLoaded={hasSamplerLoaded}
        updateActiveNotes={updateActiveNotes}
        isNoteInputEnabled={isNoteInputEnabled}
        isExercisePlayingRef={isExercisePlayingRef}
        answerMidiValueSequence={answerMidiValueSequence}
        />
      <div className="Piano-controlsContainer">
        <div className="Piano-controlsWrapper">
          {!!sourceUrl && <h5 className="Piano-headlineMidi">MIDI</h5>}
          {!!sourceUrl && renderMidiPlayerControls()}
          {!!sourceUrl && !!midiTrackTitle && renderMidiTrackTitle()}
        </div>
        <div className="Piano-earTrainingControlsContainer">
          {content.tests.length !== 0 && renderEarTrainingControls(currentTest)}
        </div>
        <div className="Piano-midiInputSwitch">
          {!!isMidiDeviceConnected && renderMidiInputSwitch()}
        </div>
      </div>
    </React.Fragment>
  );
}

PianoDisplay.propTypes = {
  ...sectionDisplayProps
};
