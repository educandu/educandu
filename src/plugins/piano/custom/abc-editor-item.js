import PropTypes from 'prop-types';
import { Form, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
import AbcNotation from '../../../components/abc-notation.js';
import { FORM_ITEM_LAYOUT } from '../../../domain/constants.js';
import { filterAbcString, getNumberOfAbcNotes } from './utils.js';

function CustomAbcNotation({ clef, initialAbc, abcRef }) {
  const { t } = useTranslation('piano');
  const [abc, setAbc] = useState(initialAbc);
  abcRef.current = setAbc;

  return (
    <Form.Item label={t('preview')} {...FORM_ITEM_LAYOUT}>
      <AbcNotation abcCode={`L:1/4 \n K:C ${clef} \n ${abc}`} />
    </Form.Item>
  );
}

// Abc preview is child so that preview can rerender without Input losing focus
export default function AbcEditorItem(props) {
  const {
    index,
    testIndex,
    noteSequence,
    handleAbcCodeChanged
  } = props;

  const { abc } = noteSequence;
  const { clef } = noteSequence;

  const [initialAbc, setInitialAbc] = useState(abc);

  const abcRef = useRef(null);
  const inputRef = useRef(null);
  const prevInputValueRef = useRef(abc);

  const { t } = useTranslation('piano');

  const handleCurrentAbcCodeChanged = event => {
    const value = event.target.value;
    const newAbc = filterAbcString(value);
    const prevInputValue = prevInputValueRef.current;
    const numberOfInputNotes = getNumberOfAbcNotes(newAbc);
    if (numberOfInputNotes <= 10) {
      // Update state in child to update preview
      abcRef.current(newAbc);
      prevInputValueRef.current = value;
    } else {
      setInitialAbc(prevInputValue);
    }
  };

  return (
    <React.Fragment>
      <CustomAbcNotation initialAbc={abc} clef={clef} abcRef={abcRef} />
      <Form.Item label={t('abcCode')} {...FORM_ITEM_LAYOUT}>
        <Input
          allowClear
          ref={inputRef}
          defaultValue={initialAbc}
          onChange={handleCurrentAbcCodeChanged}
          onBlur={() => handleAbcCodeChanged(prevInputValueRef.current, testIndex, index)}
          />
      </Form.Item>
    </React.Fragment>
  );
}

CustomAbcNotation.propTypes = {
  abcRef: PropTypes.object.isRequired,
  clef: PropTypes.string.isRequired,
  initialAbc: PropTypes.string.isRequired
};

AbcEditorItem.propTypes = {
  noteSequence: PropTypes.object.isRequired,
  handleAbcCodeChanged: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
  testIndex: PropTypes.number.isRequired
};

