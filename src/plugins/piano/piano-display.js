/* eslint-disable max-lines */
import * as u from './utils.js';
import { C } from './constants.js';
import StopIcon from './stop-icon.js';
import CustomPiano from './custom-piano.js';
import CustomSwitch from './custom-switch.js';
import { useTranslation } from 'react-i18next';
import urlUtils from '../../utils/url-utils.js';
import BackspaceIcon from './backspace-icon.js';
import React, { useEffect, useRef, useState } from 'react';
import AbcNotation from '../../components/abc-notation.js';
import ClientConfig from '../../bootstrap/client-config.js';
import CardSelector from '../../components/card-selector.js';
import { Button, Radio, InputNumber, Slider, Form } from 'antd';
import { useService } from '../../components/container-context.js';
import { sectionDisplayProps } from '../../ui/default-prop-types.js';
import PlayIcon from '../../components/icons/media-player/play-icon.js';
import PauseIcon from '../../components/icons/media-player/pause-icon.js';
import { useMidiData, usePianoId, useToneJsSampler, useMidiDevice, useExercise, useMidiPlayer } from './custom-hooks.js';

export default function PianoDisplay({ content }) {

  const keys = useRef(null);
  const activeNotes = useRef([]);
  const RadioGroup = Radio.Group;
  const RadioButton = Radio.Button;
  const noteDurationRef = useRef(2000);
  const isMidiInputEnabled = useRef(false);
  const isNoteInputEnabled = useRef(false);
  const { t } = useTranslation('piano');
  const isExercisePlayingRef = useRef(false);
  const playExerciseMode = useRef('successive');
  const clientConfig = useService(ClientConfig);
  const getNoteNameFromMidiValue = midiValue => C.MIDI_NOTE_NAMES[midiValue];
  const [playExerciseStartIndex, setPlayExerciseStartIndex] = useState(0);
  const { sourceType, sourceUrl, midiTrackTitle, colors, tests, sampleType } = content;
  const src = urlUtils.getMidiUrl({ cdnRootUrl: clientConfig.cdnRootUrl, sourceType, sourceUrl });

  const canShowSolutionRef = useRef(false); // For getStyle in components KeyWhite and KeyWhiteWithBlack XXX Nochmal checken ob state variable gehen würde
  const [canShowSolution, setCanShowSolution] = useState(false);

  // Ref is required to make helper function currentTest work in callback function inputNote
  const currentTestIndexRef = useRef(0);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);

  // With state variable instead of Ref test index / note sequence index and displayed exercises do not necessarily match in noteSequence mode
  const currentExerciseIndexRef = useRef(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Custom hooks returning state/ref variables
  const midiData = useMidiData(src);
  const pianoId = usePianoId('default');
  const isMidiDeviceConnected = useMidiDevice();
  const [sampler, hasSamplerLoaded] = useToneJsSampler(sampleType);
  const [midiPlayer, midiPlayerHandlerRef] = useMidiPlayer(midiData);
  const exerciseData = useExercise(content, currentTestIndex, currentExerciseIndex, content.keyRange);

  const {
    clef,
    keyRange,
    solution,
    indication,
    chordVector,
    indicationMidiValue
  } = exerciseData ? exerciseData : {};

  const exerciseDataRef = useRef(null);
  exerciseDataRef.current = exerciseData;

  const chord = C.CHORD_VECTOR_MAP.get(JSON.stringify(chordVector));

  const answerAbcNoteNameSequenceRef = useRef([]);
  const answerMidiValueSequenceRef = useRef([]);
  const [answerMidiValueSequence, setAnswerMidiValueSequence] = useState([]);
  const [answerAbc, setAnswerAbc] = useState('');

  const currentTest = () => tests[currentTestIndexRef.current] ? tests[currentTestIndexRef.current] : {};
  const { exerciseType, isCustomNoteSequence, customNoteSequences } = currentTest();

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

  // Keeps track of active notes for midi player events as well as midi device and mouse input.
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
    const midiNoteNameSequence = exerciseDataRef.current.midiNoteNameSequence;
    if (exerciseType !== C.EXERCISE_TYPES.noteSequence && playExerciseMode.current === 'simultaneous') {
      await u.playNotesSimultaneously(sampler.current, midiNoteNameSequence, noteDurationRef, isExercisePlayingRef);
      return;
    }

    u.playNotesSuccessively(sampler.current, midiNoteNameSequence, noteDurationRef, isExercisePlayingRef, playExerciseStartIndex);
  };

  const resetEarTrainingControls = () => {
    setAnswerAbc('');
    setCanShowSolution(false);
    canShowSolutionRef.current = false;
    setPlayExerciseStartIndex(0);
    isExercisePlayingRef.current = false;
    answerAbcNoteNameSequenceRef.current.length = 0;
    answerMidiValueSequenceRef.current.length = 0;
    setAnswerMidiValueSequence([]);

    if (exerciseType === C.EXERCISE_TYPES.noteSequence
    && isCustomNoteSequence
    && customNoteSequences.length - 1 < currentExerciseIndex + 1) {

      setCurrentExerciseIndex(0);
      currentExerciseIndexRef.current = 0;
      return;
    }
    setCurrentExerciseIndex(prev => prev + 1);
    currentExerciseIndexRef.current += 1;
  };

  const resetAllKeyStyles = () => {
    for (const key of keys.current) {
      if (typeof key !== 'undefined') {
        key.style.backgroundColor = key.dataset.defaultColor;
      }
    }
  };

  const updateKeyStyle = (eventType, midiValue) => {
    const key = keys.current[midiValue];
    if (typeof key === 'undefined' || (!u.isNoteSequenceExercise(currentTest()) && isNoteInputEnabled.current)) {
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

    const midiValueSequence = exerciseDataRef.current.midiValueSequence;
    const abcNoteNameSequence = exerciseDataRef.current.abcNoteNameSequence;

    if (canShowSolutionRef.current || u.isKeyOutOfRange(keyRange, midiValue)) {
      return;
    }

    // Don't allow to input more notes than needed. Max note input number is number of solution notes - 1: First note (indication) can not be input or deleted
    const isAnswerComplete = u.isAnswerComplete({
      test: currentTest(),
      answerMidiValueSequenceRef,
      midiValueSequence,
      answerAbcNoteNameSequenceRef,
      abcNoteNameSequence
    });

    if (!u.isNoteSequenceExercise(currentTest())) {

      // Toggle answer key
      if (answerMidiValueSequenceRef.current.includes(midiValue)) {
        setAnswerMidiValueSequence(prev => {
          const arr = [...prev];
          const index = arr.indexOf(midiValue);
          answerMidiValueSequence.current.splice(index, 1);
          arr.splice(index, 1);
          return arr;
        });
      } else if (!isAnswerComplete) {
        answerMidiValueSequenceRef.current.push(midiValue);
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
    const noteName = getNoteNameFromMidiValue(midiValue);
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

  // Stored in browser document object to be called from sibling pianos.
  // Disables MIDI device input when sibling piano midi input switch is set true.
  const disableInput = id => {
    if (id === pianoId) {
      return;
    }
    isMidiInputEnabled.current = false;
    const switchElem = document.querySelector(`.${pianoId}.Piano-Switch`);
    if (switchElem && switchElem.classList.contains('Piano-SwitchChecked')) {
      switchElem.classList.remove('Piano-SwitchChecked');
    }
    resetAllKeyStyles();
  };

  const updateMidiMessageHandlers = () => {
    if (isMidiInputEnabled.current && isMidiDeviceConnected) {
      for (const input of document.midiAccessObj.inputs.values()) {
        input.onmidimessage = null;
        input.onmidimessage = handleMidiDeviceEvent;
      }
    }
  };

  // Disable midi input for sibling pianos when switch is set true
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
      disableInput
    });

    for (const piano of document.midiPianos) {
      piano.disableInput(pianoId);
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
      currentTestIndexRef.current = testIndex;
      setCurrentExerciseIndex(0);
      currentExerciseIndexRef.current = 0;
      resetEarTrainingControls();
    }
  };

  const renderMidiPlayerControls = () => (
    <div className="Piano-midiPlayerControls" >
      <Button onClick={startMidiPlayer} icon={<PlayIcon />} />
      <Button onClick={pauseMidiPlayer} icon={<PauseIcon />} />
      <Button onClick={stopMidiPlayer} icon={<StopIcon />} />
    </div>
  );

  const renderInputSwitch = () => (
    <React.Fragment>
      <CustomSwitch handleSwitchClick={handleSwitchClick} pianoId={pianoId} />
      <div>{t('midiInput')}</div>
    </React.Fragment>
  );

  const renderMidiTrackTitle = () => (
    <div className="Piano-midiTrackTitle">{midiTrackTitle}</div>
  );

  const renderPlayExerciseModeRadioGroup = () => (
    <div className="Piano-PlayExerciseModeRG">
      <RadioGroup defaultValue="successive">
        <RadioButton value="successive" onChange={() => { playExerciseMode.current = 'successive'; }}>{t('successive')}</RadioButton>
        <RadioButton value="simultaneous" onChange={() => { playExerciseMode.current = 'simultaneous'; }}>{t('simultaneous')}</RadioButton>
      </RadioGroup>
    </div>
  );

  const renderNoteSequenceControls = () => {
    return (
      <Form.Item label={t('playFromNote')} className="Piano-EarTrainingControlsItem">
        <InputNumber
          value={playExerciseStartIndex + 1}
          min={1}
          max={exerciseData.abcNoteNameSequence.length}
          onChange={value => { setPlayExerciseStartIndex(value - 1); }}
          />
      </Form.Item>
    );
  };

  const tipformatter = value => `${(value / 1000).toFixed(1)}s`;

  const renderEarTrainingControls = () => (
    <div className="Piano-EarTrainingControls">
      <h4>{`${t('earTraining')}: ${t(exerciseType)} ${u.usesWhiteKeysOnly(currentTest()) ? `(${t('whiteKeysOnly')})` : ''}`}</h4>
      <div className="Piano-EarTrainingControlsItem">
        <Button onClick={playExercise} icon={<PlayIcon />} />
        <Button onClick={() => { isExercisePlayingRef.current = false; }} icon={<StopIcon />} />
      </div>
      <Form>
        <Form.Item label={t('noteDuration')} className="Piano-EarTrainingControlsItem">
          <Slider tipFormatter={tipformatter} defaultValue={2000} min={200} max={4000} step={100} onChange={value => { noteDurationRef.current = value; }} />
        </Form.Item>
        {exerciseType === C.EXERCISE_TYPES.noteSequence && renderNoteSequenceControls()}
        {exerciseType !== C.EXERCISE_TYPES.noteSequence && renderPlayExerciseModeRadioGroup()}
      </Form>
      <div>
        <Button
          className="Piano-BtnShowHideSolution"
          onClick={() => {
            setCanShowSolution(prev => !prev);
            canShowSolutionRef.current = !canShowSolutionRef.current;
          }}
          >
          {canShowSolution ? t('hideSolution') : t('showSolution')}
        </Button>
        <Button className="Piano-BtnNewExercise" onClick={resetEarTrainingControls}>{t('newExercise')}</Button>
      </div>
    </div>
  );

  useEffect(() => {
    updateMidiMessageHandlers();
    manageSiblingPianosMidiInput();
  });

  useEffect(() => {
    midiPlayerHandlerRef.current.updateActiveNotes = updateActiveNotes;
    midiPlayerHandlerRef.current.handleMidiPlayerEvent = handleMidiPlayerEvent;
    midiPlayerHandlerRef.current.resetAllKeyStyles = resetAllKeyStyles;
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

  return (
    <React.Fragment>
      {testCards.length > 1 && (
        <div className="EarTrainingDisplay-controlPanel">
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
      <div className="Piano-AbcDisplayContainer">
        {exerciseType === 'noteSequence' && (
          <div className="AbcNotation" style={{ display: 'flex' }}>
            <div className="AbcNotation-wrapper u-width-65 Piano-AnswerAbcDisplay">
              <div className="Piano-NoteInputSwitch">
                <CustomSwitch handleSwitchClick={isChecked => { isNoteInputEnabled.current = isChecked; }} />
                <div>{t('noteInput')}</div>
              </div>
              <div className="Piano-AnswerAbcNotation">
                <AbcNotation abcCode={`L:1/4 \n K:C ${clef || 'treble'} \n ${indication + answerAbc}`} />
              </div>
              <Button onClick={deleteNote} icon={<BackspaceIcon />} className="Piano-BtnDeleteNote" />
            </div>
            <div className="AbcNotation-wrapper u-width-65 Piano-SolutionAbcDisplay">
              <div>{canShowSolution ? t('solution') : t('firstNote')}</div>
              <div className="Piano-SolutionAbcNotation">
                <AbcNotation abcCode={`L:1/4 \n K:C ${clef || 'treble'} \n ${canShowSolution ? solution : indication}`} />
              </div>
            </div>
          </div>
        )}
      </div>
      {[C.EXERCISE_TYPES.interval, C.EXERCISE_TYPES.chord].includes(exerciseType) && (
        <div className="Piano-threeFlexColumnsContainer">
          <div className="Piano-OneOfThreeFlexColumns">
            <div className="Piano-switchContainer">
              <CustomSwitch handleSwitchClick={isChecked => { isNoteInputEnabled.current = isChecked; }} />
              <div>{t('noteInput')}</div>
            </div>
          </div>
          <div className="Piano-ChordSolutionDisplay">
            {!!canShowSolution && exerciseType === C.EXERCISE_TYPES.chord && <div>{`${t(chord.type)}, ${t(chord.inversion)}`}</div>}
          </div>
          <div className="Piano-OneOfThreeFlexColumns">
            <div />
          </div>
        </div>
      )}
      <CustomPiano
        keys={keys}
        colors={colors}
        content={content}
        pianoId={pianoId}
        sampler={sampler}
        test={currentTest()}
        inputNote={inputNote}
        activeNotes={activeNotes}
        exerciseData={exerciseData}
        updateKeyStyle={updateKeyStyle}
        hasSamplerLoaded={hasSamplerLoaded}
        updateActiveNotes={updateActiveNotes}
        canShowSolutionRef={canShowSolutionRef}
        isNoteInputEnabled={isNoteInputEnabled}
        isExercisePlayingRef={isExercisePlayingRef}
        answerMidiValueSequence={answerMidiValueSequence}
        />
      <div className="Piano-MidiControlsContainer">
        <div className="Piano-MidiControlsWrapper">
          {!!sourceUrl && <h4>MIDI</h4>}
          {!!sourceUrl && renderMidiPlayerControls()}
          {!!sourceUrl && !!midiTrackTitle && renderMidiTrackTitle()}
        </div>
        <div className="Piano-EarTrainingControlsContainer">
          {content.tests.length !== 0 && renderEarTrainingControls()}
        </div>
        <div className="Piano-inputSwitch">
          {!!isMidiDeviceConnected && renderInputSwitch()}
        </div>
      </div>
    </React.Fragment>
  );
}

PianoDisplay.propTypes = {
  ...sectionDisplayProps
};
