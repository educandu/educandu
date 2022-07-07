import React from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import NeverScrollingTextArea from '../../components/never-scrolling-text-area.js';

function IntervalTrainerEditor({ content, onContentChanged }) {
  const { t } = useTranslation('intervalTrainer');
  const json = JSON.stringify(content, null, 2) || '';

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
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
      <NeverScrollingTextArea value={json} onChange={handleJSONValueChanged} />
    </div>
  );
}

IntervalTrainerEditor.propTypes = {
  ...sectionEditorProps
};

export default IntervalTrainerEditor;
