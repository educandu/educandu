import { Piano } from 'react-piano';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import React, { Fragment, useState } from 'react';
import { Form, Input, Radio, Button } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import { CDN_URL_PREFIX, MIDI_SOURCE_TYPE } from '../../domain/constants.js';
import ResourcePicker from '../../components/resource-picker/resource-picker.js';
import { storageLocationPathToUrl, urlToStorageLocationPath } from '../../utils/storage-utils.js';

export default function MidiPianoEditor({ content, onContentChanged }) {

  const FormItem = Form.Item;
  const RadioGroup = Radio.Group;
  const RadioButton = Radio.Button;
  const { t } = useTranslation('midiPiano');
  const { sourceType, sourceUrl, midiTrackTitle, activeNotes } = content;
  const [keyRangeSelectorPianoOpened, setKeyRangeSelectorOpened] = useState(false);

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalidSourceUrl
      = newContent.sourceType === MIDI_SOURCE_TYPE.external
      && validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';
    onContentChanged(newContent, isInvalidSourceUrl);
  };

  const handleSourceTypeValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceType: value, sourceUrl: '' });
  };

  const handleExternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleInternalSourceUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ sourceUrl: value });
  };

  const handleInternalSourceUrlFileNameChanged = value => {
    changeContent({ sourceUrl: value });
  };

  const handleMidiTrackTitleValueChanged = event => {
    const { value } = event.target;
    changeContent({ midiTrackTitle: value });
  };

  const handleActiveNotesChanged = midiValue => {
    let validNoteRange;
    let array = [...activeNotes];

    if (array.includes(midiValue)) {
      const index = array.indexOf(midiValue);
      array.splice(index, 1);
      if (array.length === 2) {
        array.sort((a, b) => {
          return a - b;
        });
        validNoteRange = {
          first: array[0],
          last: array[1]
        };
        changeContent({ activeNotes: array, noteRange: validNoteRange });
        return;
      }
      changeContent({ activeNotes: array });
      return;
    }
    array = [...activeNotes, midiValue];
    if (array.length === 2) {
      array.sort((a, b) => {
        return a - b;
      });
      validNoteRange = {
        first: array[0],
        last: array[1]
      };
      changeContent({ activeNotes: array, noteRange: validNoteRange });
      return;
    }
    changeContent({ activeNotes: array, noteRange: validNoteRange });
  };

  const renderSourceTypeInput = (value, onChangeHandler) => (
    <FormItem label={t('common:source')} {...formItemLayout}>
      <RadioGroup value={value} onChange={onChangeHandler}>
        <RadioButton value={MIDI_SOURCE_TYPE.external}>{t('common:externalLink')}</RadioButton>
        <RadioButton value={MIDI_SOURCE_TYPE.internal}>{t('common:internalCdn')}</RadioButton>
      </RadioGroup>
    </FormItem>
  );

  const renderInternalSourceTypeInput = (value, onInputChangeHandler, onFileChangeHandler) => (
    <FormItem label={t('common:internalUrl')} {...formItemLayout}>
      <div className="u-input-and-button">
        <Input
          addonBefore={CDN_URL_PREFIX}
          value={value}
          onChange={onInputChangeHandler}
          />
        <ResourcePicker
          url={storageLocationPathToUrl(value)}
          onUrlChange={url => onFileChangeHandler(urlToStorageLocationPath(url))}
          />
      </div>
    </FormItem>
  );

  const renderExternalSourceTypeInput = (value, onChangeHandler) => (
    <FormItem label={t('common:externalUrl')} {...formItemLayout} {...validation.validateUrl(value, t)} hasFeedback>
      <Input value={value} onChange={onChangeHandler} />
    </FormItem>
  );

  const renderMidiTrackTitleInput = (value, onChangeHandler) => (
    <FormItem label={t('midiPiano:midiTrackTitle')} {...formItemLayout} hasFeedback>
      <Input value={value} onChange={onChangeHandler} />
    </FormItem>
  );

  const toggleKeyRangeSelectorPiano = () => {
    setKeyRangeSelectorOpened(!keyRangeSelectorPianoOpened);
  };

  const renderKeyRangeSelectorPiano = () => (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ backgroundColor: 'white',
        position: 'absolute',
        padding: '1.3rem',
        margin: 'auto',
        zIndex: '10',
        width: '95vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        aspectRatio: '10/1',
        border: '1px solid darkgrey',
        borderRadius: '8px',
        transformOrigin: 'center' }}
        >
        <div style={{ width: 'fit-content', fontSize: '14px' }}>{t('midiPiano:keyRangeSelectionNote')}</div>
        <Piano
          playNote={() => {}}
          stopNote={() => {}}
          onPlayNoteInput={handleActiveNotesChanged}
          onStopNoteInput={() => {}}
          noteRange={{ first: 21, last: 108 }}
          activeNotes={activeNotes}
          />
        <Button style={{ width: 'fit-content' }} onClick={toggleKeyRangeSelectorPiano}>{t('midiPiano:confirm')}</Button>
      </div>
    </div>
  );

  const renderKeyRangeSelector = () => (
    <Fragment>
      <FormItem label={t('midiPiano:pianoKeyRange')} {...formItemLayout} hasFeedback>
        <Button onClick={toggleKeyRangeSelectorPiano} >...</Button>
      </FormItem>
      {keyRangeSelectorPianoOpened
        && renderKeyRangeSelectorPiano()}
    </Fragment>
  );

  return (
    <div className="MidiPianoEditor">

      {renderKeyRangeSelector()}

      {renderMidiTrackTitleInput(midiTrackTitle, handleMidiTrackTitleValueChanged)}

      <Form>
        {renderSourceTypeInput(sourceType, handleSourceTypeValueChanged)}

        {sourceType === MIDI_SOURCE_TYPE.external
          && renderExternalSourceTypeInput(sourceUrl, handleExternalSourceUrlValueChanged)}

        {sourceType === MIDI_SOURCE_TYPE.internal
          && renderInternalSourceTypeInput(sourceUrl, handleInternalSourceUrlValueChanged, handleInternalSourceUrlFileNameChanged)}
      </Form>
    </div>
  );
}

MidiPianoEditor.propTypes = {
  ...sectionEditorProps
};
