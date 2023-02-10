/* eslint-disable max-lines */
import * as ut from './custom/utils.js';
import id from '../../utils/unique-id.js';
import MidiPianoInfo from './piano-info.js';
import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import { pianoLayout } from './custom/piano.js';
import { PlusOutlined } from '@ant-design/icons';
import cloneDeep from '../../utils/clone-deep.js';
import UrlInput from '../../components/url-input.js';
import ItemPanel from '../../components/item-panel.js';
import AbcEditorItem from './custom/abc-editor-item.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { KeyWhite, KeyWhiteWithBlack } from './custom/keys.js';
import { useService } from '../../components/container-context.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { swapItemsAt, removeItemAt } from '../../utils/array-utils.js';
import { Form, Input, Radio, Button, Slider, Checkbox, Divider } from 'antd';
import { EXERCISE_TYPES, INTERVAL_NAMES, TRIADS, SEVENTH_CHORDS, INVERSIONS } from './custom/constants.js';

export default function PianoEditor({ content, onContentChanged }) {

  const FormItem = Form.Item;
  const RadioGroup = Radio.Group;
  const RadioButton = Radio.Button;
  const keyRangeSelection = useRef([]);
  const abcHasBeenInput = useRef(false);
  const { t } = useTranslation('piano');
  const pianoInfo = useService(MidiPianoInfo);
  const { tests, sourceUrl, midiTrackTitle } = content;
  const selectorPianoColors = { whiteKey: 'white', blackKey: 'black' };
  const [canRenderSelectorPiano, setCanRenderSelectorPiano] = useState(false);

  const formatter = value => {
    const tooltips = { 1: t('noteB'), 2: 'C', 3: 'D', 4: 'E', 5: 'F', 6: 'G', 0: 'A' };
    return tooltips[value % 7];
  };

  const getCheckboxStateAndNewTests = event => {
    const checkedState = event.target.checked;
    const newTests = cloneDeep(tests);
    return [checkedState, newTests];
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    onContentChanged(newContent);
  };

  const handleDeleteTest = index => {
    const newTests = removeItemAt(tests, index);
    changeContent({ tests: newTests });
  };

  const handleMoveTestUp = index => {
    const newTests = swapItemsAt(tests, index, index - 1);
    changeContent({ tests: newTests });
  };

  const handleMoveTestDown = index => {
    const newTests = swapItemsAt(tests, index, index + 1);
    changeContent({ tests: newTests });
  };

  const handleDeleteNoteSequence = (testIndex, index) => {
    const newTests = cloneDeep(tests);
    const newNoteSequences = removeItemAt(tests[testIndex].customNoteSequences, index);
    newTests[testIndex].customNoteSequences = newNoteSequences;
    changeContent({ tests: newTests });
  };

  const handleMoveNoteSequenceUp = (testIndex, index) => {
    const newTests = cloneDeep(tests);
    const newNoteSequences = swapItemsAt(tests[testIndex].customNoteSequences, index, index - 1);
    newTests[testIndex].customNoteSequences = newNoteSequences;
    changeContent({ tests: newTests });
  };

  const handleMoveNoteSequenceDown = (testIndex, index) => {
    const newTests = cloneDeep(tests);
    const newNoteSequences = swapItemsAt(tests[testIndex].customNoteSequences, index, index + 1);
    newTests[testIndex].customNoteSequences = newNoteSequences;
    changeContent({ tests: newTests });
  };

  const handleAddTestButtonClick = () => {
    const newTests = cloneDeep(tests);
    newTests.push(pianoInfo.getDefaultTest());
    changeContent({ tests: newTests });
  };

  const handleIntervalCheckboxStateChanged = (event, exerciseType, checkboxStates, index) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    const checkbox = event.target;
    const interval = checkbox.interval;
    const intervalType = checkbox.intervalType;
    const newCheckboxStates = cloneDeep(checkboxStates);

    const updateAllCheckboxStates = intervalSelector => {
      if (typeof newCheckboxStates[intervalSelector].minor === 'undefined') {
        newCheckboxStates[intervalSelector] = checkedState;
      } else {
        newCheckboxStates[intervalSelector].minor = checkedState;
        newCheckboxStates[intervalSelector].major = checkedState;
      }
    };

    const updateCheckboxStates = intervalSelector => {
      if (typeof newCheckboxStates[intervalSelector].minor === 'undefined') {
        newCheckboxStates[intervalSelector] = checkedState;
      }
      if (typeof newCheckboxStates[intervalSelector].minor !== 'undefined' && !!intervalType) {
        newCheckboxStates[intervalSelector][intervalType] = checkedState;
      }
      if (typeof newCheckboxStates[intervalSelector].minor !== 'undefined' && !intervalType) {
        newCheckboxStates[intervalSelector].minor = checkedState;
        newCheckboxStates[intervalSelector].major = checkedState;
      }
    };

    if (!checkedState) {
      newCheckboxStates.all = false;
    }

    if (checkbox.interval === 'all') {
      newCheckboxStates.all = checkedState;
      Object.keys(newCheckboxStates).forEach(key => {
        updateAllCheckboxStates(key);
      });
    } else {
      updateCheckboxStates(interval);
    }
    newTests[index][`${exerciseType}CheckboxStates`] = newCheckboxStates;
    ut.ensureOneIntervalIsChecked(index, newTests, exerciseType);
    changeContent({ tests: newTests });
  };

  const handleDirectionCheckboxStateChanged = (event, direction, index) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    const otherDirection = direction === 'up' ? 'down' : 'up';
    newTests[index].directionCheckboxStates[direction] = checkedState;
    if (!checkedState) {
      newTests[index].directionCheckboxStates[otherDirection] = true;
    }
    changeContent({ tests: newTests });
  };

  const handleAllChordOptionsStateChanged = (event, index) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    const exerciseType = tests[index].exerciseType;

    newTests[index].allChordOptions = checkedState;

    for (const key of Object.keys(newTests[index].triadCheckboxStates)) {
      newTests[index].triadCheckboxStates[key] = checkedState;
    }
    for (const key of Object.keys(newTests[index].seventhChordCheckboxStates)) {
      newTests[index].seventhChordCheckboxStates[key] = checkedState;
    }
    for (const key of Object.keys(newTests[index].inversionCheckboxStates)) {
      newTests[index].inversionCheckboxStates[key] = checkedState;
    }
    newTests[index][`${exerciseType}AllowsLargeIntervals`] = checkedState;

    !checkedState && ut.ensureOneInversionIsChecked(index, newTests);
    !checkedState && ut.ensureOneChordIsChecked(index, newTests);

    changeContent({ tests: newTests });
  };

  const handleTriadCheckboxStateChanged = (event, index, triad) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    newTests[index].triadCheckboxStates[triad] = checkedState;
    if (!checkedState) {
      newTests[index].allChordOptions = checkedState;
      ut.ensureOneChordIsChecked(index, newTests);
    }
    changeContent({ tests: newTests });
  };

  const handleSeventhChordCheckboxStateChanged = (event, index, chord) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    newTests[index].seventhChordCheckboxStates[chord] = checkedState;
    if (!checkedState) {
      newTests[index].allChordOptions = checkedState;
      ut.ensureOneChordIsChecked(index, newTests);
    }
    changeContent({ tests: newTests });
  };

  const handleInversionCheckboxStateChanged = (event, index, inversion) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    newTests[index].inversionCheckboxStates[inversion] = checkedState;
    if (!checkedState) {
      newTests[index].allChordOptions = checkedState;
      ut.ensureOneInversionIsChecked(index, newTests);
    }
    changeContent({ tests: newTests });
  };

  const handleKeyRangeChanged = () => {
    const keyRangeValues = keyRangeSelection.current.sort((a, b) => {
      return a - b;
    });
    const keyRange = {
      first: keyRangeValues[0],
      last: keyRangeValues[keyRangeValues.length - 1]
    };
    setCanRenderSelectorPiano(!canRenderSelectorPiano);
    changeContent({ keyRange });
  };

  const handleWhiteKeysCheckboxStateChanged = (event, index) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    newTests[index].whiteKeysOnly = checkedState;
    changeContent({ tests: newTests });
  };

  const handleNoteRangeChanged = (event, index) => {
    const newTests = cloneDeep(tests);
    const { exerciseType } = tests[index];
    // NoteRange is range of notes provided for ear training exercise. Will be turned into keyRange (part of piano to be rendered) in custom hook useExercise
    // Both noteRange and keyRange define first and last white key index (not midi values) of part of piano to be rendered
    newTests[index][`${exerciseType}NoteRange`] = { first: event[0], last: event[1] };
    changeContent({ tests: newTests });
  };

  const handleCustomNoteSequenceNoteRangeChanged = (event, testIndex, index) => {
    // See handleNoteRangeChanged above
    const newTests = cloneDeep(tests);
    newTests[testIndex].customNoteSequences[index].noteRange = { first: event[0], last: event[1] };
    changeContent({ tests: newTests });
  };

  const updateKeyRangeSelection = event => {
    event.target.classList.toggle('Piano-keySelected');
    const value = parseInt(event.target.dataset.index, 10);
    if (!keyRangeSelection.current.includes(value)) {
      keyRangeSelection.current.push(value);
      return;
    }
    const index = keyRangeSelection.current.indexOf(value);
    keyRangeSelection.current.splice(index, 1);
  };

  const handleSourceUrlChange = value => {
    changeContent({ sourceUrl: value });
  };

  const handleExerciseTypeValueChanged = (event, index) => {
    const value = event.target.value;
    const newTests = cloneDeep(tests);
    newTests[index].exerciseType = value;
    changeContent({ tests: newTests });
  };

  const handleMidiTrackTitleValueChanged = event => {
    const { value } = event.target;
    changeContent({ midiTrackTitle: value });
  };

  const handleNumberOfNotesValueChanged = (event, index) => {
    const value = event;
    const newTests = cloneDeep(tests);
    newTests[index].numberOfNotes = value;
    changeContent({ tests: newTests });
  };

  const handleNoteSequenceTypeChanged = (event, index) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[index].isCustomNoteSequence = value;
    changeContent({ tests: newTests });
  };

  const handleAbcCodeChanged = (string, testIndex, noteSequenceIndex) => {
    const abcString = string.length !== 0 ? string : 'C';
    const { abcNoteNameSequence, midiNoteNameSequence, midiValueSequence, filteredAbc } = ut.analyseABC(abcString);
    const newCustomNoteSequences = tests[testIndex].customNoteSequences.map((nS, i) => i === noteSequenceIndex
      ? { ...nS,
        abc: abcString,
        abcNoteNameSequence,
        midiNoteNameSequence,
        midiValueSequence,
        filteredAbc }
      : nS);
    const newTests = tests.map((test, i) => i === testIndex ? { ...test, customNoteSequences: newCustomNoteSequences } : test);
    abcHasBeenInput.current = true;
    changeContent({ tests: newTests });
  };

  const handleClefTypeChanged = (event, testIndex) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[testIndex].clef = value;
    changeContent({ tests: newTests });
  };

  const handleCustomNoteSequenceClefTypeChanged = (event, testIndex, noteSequenceIndex) => {
    const { value } = event.target;
    const newTests = cloneDeep(tests);
    newTests[testIndex].customNoteSequences[noteSequenceIndex].clef = value;
    changeContent({ tests: newTests });
  };

  const handleAddCustomNoteSequenceButtonClick = index => {
    const newTests = cloneDeep(tests);
    newTests[index].customNoteSequences.push(pianoInfo.getDefaultCustomNoteSequence());
    changeContent({ tests: newTests });
  };

  const handleLargeIntervalsCheckboxStateChanged = (event, index) => {
    const [checkedState, newTests] = getCheckboxStateAndNewTests(event);
    const exerciseType = tests[index].exerciseType;
    newTests[index][`${exerciseType}AllowsLargeIntervals`] = checkedState;
    if (!checkedState && exerciseType === EXERCISE_TYPES.chord) {
      newTests[index].allChordOptions = checkedState;
    }
    changeContent({ tests: newTests });
  };

  const toggleSelectorPiano = () => {
    setCanRenderSelectorPiano(!canRenderSelectorPiano);
  };

  const renderMidiTrackTitleInput = (value, onChangeHandler) => (
    <FormItem label={t('common:title')} {...FORM_ITEM_LAYOUT}>
      <Input value={value} onChange={onChangeHandler} />
    </FormItem>
  );

  const renderSelectorPiano = () => (
    <div className="Piano-selectorPianoContainer">
      <div className="Piano-selectorPianoWrapper">
        <div>
          {t('keyRangeSelectionText')}
        </div>
        <div className="Piano-selectorPiano">
          {pianoLayout.map((elem, index) => {
            if (elem[0] === 0 && index < pianoLayout.length - 1) {
              return (
                <KeyWhiteWithBlack
                  updateKeyRangeSelection={updateKeyRangeSelection}
                  key={id.create()}
                  midiValue={elem[1]}
                  index={index}
                  colors={selectorPianoColors}
                  />
              );
            }
            return <KeyWhite updateKeyRangeSelection={updateKeyRangeSelection} key={id.create()} midiValue={elem[1]} index={index} colors={selectorPianoColors} />;
          })}
        </div>
        <div>
          <Button onClick={handleKeyRangeChanged}>{t('common:confirm')}</Button>
        </div>
      </div>
    </div>
  );

  const renderKeyRangeSelector = onClickHandler => (
    <React.Fragment>
      <FormItem label={t('pianoKeyRange')} {...FORM_ITEM_LAYOUT}>
        <Button onClick={onClickHandler} >. . .</Button>
      </FormItem>
      {!!canRenderSelectorPiano && renderSelectorPiano()}
    </React.Fragment>
  );

  const renderWhiteKeysCheckbox = index => (
    <Checkbox
      className="Piano-whiteKeysCheckbox"
      defaultChecked={tests[index].whiteKeysOnly}
      onChange={event => handleWhiteKeysCheckboxStateChanged(event, index)}
      >
      {t('whiteKeysOnly')}
    </Checkbox>
  );

  const renderNoteRangeSelector = (testIndex, onAfterChangeHandler, noteRange, index) => {

    return (
      <FormItem label={t('noteRange')} {...FORM_ITEM_LAYOUT}>
        <Slider
          min={0}
          max={51}
          defaultValue={[noteRange.first, noteRange.last]}
          onAfterChange={event => onAfterChangeHandler(event, testIndex, index)}
          range
          tooltip={{ formatter }}
          marks={{ 2: t('c1'), 9: t('c2'), 16: t('c3'), 23: t('c4'), 30: t('c5'), 37: t('c6'), 44: t('c7'), 51: t('c8') }}
          />
        {ut.isRandomNoteSequenceExercise(tests[testIndex]) && renderWhiteKeysCheckbox(testIndex)}
      </FormItem>
    );
  };

  const renderClefTypeSelector = (testIndex, clef, onChangeHandler, index) => (
    <FormItem label={t('clef')} {...FORM_ITEM_LAYOUT}>
      <RadioGroup value={clef}>
        <RadioButton value="treble" onChange={event => onChangeHandler(event, testIndex, index)}>{t('trebleClef')}</RadioButton>
        <RadioButton value="bass" onChange={event => onChangeHandler(event, testIndex, index)}>{t('bassClef')}</RadioButton>
      </RadioGroup>
    </FormItem>
  );

  const renderIntervalSelector = (checkboxStates, exerciseType, testIndex) => (
    <React.Fragment>
      <FormItem label={t('intervals')} {...FORM_ITEM_LAYOUT}>
        <div>
          <Checkbox
            defaultChecked={checkboxStates.all}
            interval="all"
            onChange={event => handleIntervalCheckboxStateChanged(event, exerciseType, checkboxStates, testIndex)}
            >{t('all')}
          </Checkbox>
        </div>
        {INTERVAL_NAMES.map((interval, index) => {
          return (
            <div key={id.create()}>
              <Checkbox
                defaultChecked={checkboxStates[interval] === true || checkboxStates[interval].minor || checkboxStates[interval].major}
                className="Piano-checkbox"
                interval={interval}
                onChange={event => handleIntervalCheckboxStateChanged(event, exerciseType, checkboxStates, testIndex)}
                >
                {t(interval)}
              </Checkbox>
              {[1, 2, 6, 7].includes(index) && !tests[testIndex].whiteKeysOnly && (
                <React.Fragment>
                  <Checkbox
                    defaultChecked={checkboxStates[interval].minor}
                    interval={interval}
                    intervalType="minor"
                    onChange={event => handleIntervalCheckboxStateChanged(event, exerciseType, checkboxStates, testIndex)}
                    >
                    {t('minor')}
                  </Checkbox>
                  <Checkbox
                    defaultChecked={checkboxStates[interval].major}
                    interval={interval}
                    intervalType="major"
                    onChange={event => handleIntervalCheckboxStateChanged(event, exerciseType, checkboxStates, testIndex)}
                    >{t('major')}
                  </Checkbox>
                </React.Fragment>
              )}
            </div>
          );
        })}
      </FormItem>
      <FormItem label={t('largeIntervals')} {...FORM_ITEM_LAYOUT}>
        <Checkbox
          defaultChecked={tests[testIndex][`${exerciseType}AllowsLargeIntervals`]}
          onChange={event => { handleLargeIntervalsCheckboxStateChanged(event, testIndex); }}
          >
          {t('intervalsPlusOctave')}
        </Checkbox>
      </FormItem>
      {exerciseType === EXERCISE_TYPES.interval && (
        <FormItem label={t('direction')} {...FORM_ITEM_LAYOUT}>
          <Checkbox
            defaultChecked={tests[testIndex].directionCheckboxStates.up}
            onChange={event => handleDirectionCheckboxStateChanged(event, 'up', testIndex)}
            >
            {t('upwards')}
          </Checkbox>
          <Checkbox
            defaultChecked={tests[testIndex].directionCheckboxStates.down}
            onChange={event => handleDirectionCheckboxStateChanged(event, 'down', testIndex)}
            >
            {t('downwards')}
          </Checkbox>
        </FormItem>
      )}
    </React.Fragment>
  );

  const renderChordSelector = index => (
    <React.Fragment>
      <FormItem label={t('options')} {...FORM_ITEM_LAYOUT}>
        <Checkbox
          key={id.create()}
          defaultChecked={tests[index].allChordOptions}
          onChange={event => handleAllChordOptionsStateChanged(event, index)}
          >
          {t('all')}
        </Checkbox>
      </FormItem>
      <FormItem label={t('triads')} {...FORM_ITEM_LAYOUT}>
        <div>
          {Object.keys(TRIADS).map(triad => (
            <Checkbox
              key={id.create()}
              defaultChecked={tests[index].triadCheckboxStates[triad]}
              onChange={event => handleTriadCheckboxStateChanged(event, index, triad)}
              >
              {t(triad)}
            </Checkbox>
          ))}
        </div>
      </FormItem>
      <FormItem label={t('seventhChords')} {...FORM_ITEM_LAYOUT}>
        {SEVENTH_CHORDS.map(chord => (
          <div key={id.create()}>
            <Checkbox
              defaultChecked={tests[index].seventhChordCheckboxStates[chord]}
              onChange={event => handleSeventhChordCheckboxStateChanged(event, index, chord)}
              >
              {t(chord)}
            </Checkbox>
          </div>
        ))}
      </FormItem>
      <FormItem label={t('inversions')} {...FORM_ITEM_LAYOUT}>
        <div>
          {Object.keys(INVERSIONS).map(inversion => (
            <Checkbox
              key={id.create()}
              defaultChecked={tests[index].inversionCheckboxStates[inversion]}
              onChange={event => handleInversionCheckboxStateChanged(event, index, inversion)}
              >
              {t(inversion)}
            </Checkbox>
          ))}
        </div>
      </FormItem>
      <FormItem label={t('largeIntervals')} {...FORM_ITEM_LAYOUT}>
        <Checkbox
          defaultChecked={tests[index][`${tests[index].exerciseType}AllowsLargeIntervals`]}
          onChange={event => { handleLargeIntervalsCheckboxStateChanged(event, index); }}
          >
          {t('allowLargeIntervals')}
        </Checkbox>
      </FormItem>
    </React.Fragment>
  );

  const renderNoteSequenceTypeSelector = index => (
    <FormItem label={t('type')} {...FORM_ITEM_LAYOUT}>
      <RadioGroup value={tests[index].isCustomNoteSequence}>
        <RadioButton value={false} onChange={event => handleNoteSequenceTypeChanged(event, index)}>{t('random')}</RadioButton>
        <RadioButton value onChange={event => handleNoteSequenceTypeChanged(event, index)}>{t('predefined')}</RadioButton>
      </RadioGroup>
    </FormItem>
  );

  const renderCustomNoteSequencePanels = testIndex => {
    return tests[testIndex].customNoteSequences.map((noteSequence, index) => (
      <ItemPanel
        index={index}
        key={id.create()}
        itemsCount={tests[testIndex].customNoteSequences.length}
        header={t('noteSequenceNumber', { number: index + 1 })}
        onMoveUp={() => handleMoveNoteSequenceUp(testIndex, index)}
        onMoveDown={() => handleMoveNoteSequenceDown(testIndex, index)}
        onDelete={() => handleDeleteNoteSequence(testIndex, index)}
        >
        {renderNoteRangeSelector(testIndex, handleCustomNoteSequenceNoteRangeChanged, tests[testIndex].customNoteSequences[index].noteRange, index)}
        {renderClefTypeSelector(testIndex, noteSequence.clef, handleCustomNoteSequenceClefTypeChanged, index)}
        <AbcEditorItem
          noteSequence={noteSequence}
          testIndex={testIndex}
          index={index}
          handleAbcCodeChanged={handleAbcCodeChanged}
          />
      </ItemPanel>
    ));
  };

  const renderNoteSequenceSelector = (numberOfNotes, index) => {
    return (
      <React.Fragment>
        {!tests[index].isCustomNoteSequence && (
          <FormItem label={t('numberOfNotes')} {...FORM_ITEM_LAYOUT}>
            <Slider
              min={3}
              max={10}
              defaultValue={numberOfNotes}
              onAfterChange={event => handleNumberOfNotesValueChanged(event, index)}
              dots
              marks={{ 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10' }}
              />
          </FormItem>
        )}
        {!tests[index].isCustomNoteSequence && renderIntervalSelector(tests[index].noteSequenceCheckboxStates, EXERCISE_TYPES.noteSequence, index)}
        {!!tests[index].isCustomNoteSequence && renderCustomNoteSequencePanels(index)}
        {!!tests[index].isCustomNoteSequence
        && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddCustomNoteSequenceButtonClick(index)}>
            {t('addCustomNoteSequence')}
          </Button>
        )}
      </React.Fragment>
    );
  };

  return (
    <div>
      <Form layout="horizontal" labelAlign="left">
        {renderKeyRangeSelector(toggleSelectorPiano)}
        <Divider>MIDI</Divider>
        {renderMidiTrackTitleInput(midiTrackTitle, handleMidiTrackTitleValueChanged)}
        <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} />
        </FormItem>
        <Divider plain>{t('earTraining')}</Divider>
        {
          tests.map((test, index) => (
            <ItemPanel
              index={index}
              key={id.create()}
              itemsCount={tests.length}
              header={t('testNumber', { number: index + 1 })}
              onMoveUp={handleMoveTestUp}
              onMoveDown={handleMoveTestDown}
              onDelete={handleDeleteTest}
              >
              <FormItem label={t('exerciseType')} {...FORM_ITEM_LAYOUT}>
                <RadioGroup onChange={event => handleExerciseTypeValueChanged(event, index)} value={test.exerciseType}>
                  <RadioButton value={EXERCISE_TYPES.interval}>{t('interval')}</RadioButton>
                  <RadioButton value={EXERCISE_TYPES.chord}>{t('chord')}</RadioButton>
                  <RadioButton value={EXERCISE_TYPES.noteSequence}>{t('noteSequence')}</RadioButton>
                </RadioGroup>
              </FormItem>
              {ut.isNoteSequenceExercise(test) && renderNoteSequenceTypeSelector(index)}
              {ut.isRandomNoteSequenceExercise(test) && renderClefTypeSelector(index, test.clef, handleClefTypeChanged)}
              {(ut.isIntervalOrChordExercise(test) || ut.isRandomNoteSequenceExercise(test)) && renderNoteRangeSelector(index, handleNoteRangeChanged, test[`${test.exerciseType}NoteRange`])}
              {ut.isIntervalExercise(test) && renderIntervalSelector(test.intervalCheckboxStates, 'interval', index)}
              {ut.isChordExercise(test) && renderChordSelector(index)}
              {ut.isNoteSequenceExercise(test) && renderNoteSequenceSelector(test.numberOfNotes, index)}
            </ItemPanel>
          ))
        }
      </Form>

      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddTestButtonClick}>
        {t('earTraining:addTest')}
      </Button>
    </div>
  );
}

PianoEditor.propTypes = {
  ...sectionEditorProps
};
