import React from 'react';
import { Input, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { sectionEditorProps } from '../../ui/default-prop-types.js';

const { TextArea } = Input;

function IntervalTrainerEditor({ content, onContentChanged }) {
  const { t } = useTranslation('intervalTrainer');
  const json = JSON.stringify(content, null, 2) || '';

  const changeContent = (newContentValues, isInvalid) => {
    onContentChanged({ ...content, ...newContentValues }, isInvalid);
  };

  const handleJSONValueChanged = event => {
    const { value } = event.target;

    let newContent;
    try {
      newContent = JSON.parse(value);
    } catch (err) {
      message.error(t('invalidJson'));
      return;
    }

    changeContent({ ...newContent });
  };

  return (
    <div>
      <TextArea value={json} onChange={handleJSONValueChanged} autoSize={{ minRows: 3 }} />
    </div>
  );
}

IntervalTrainerEditor.propTypes = {
  ...sectionEditorProps
};

export default IntervalTrainerEditor;
