import React from 'react';
import { Checkbox, Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import AbcInput from '../../components/abc-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import CopyrightNoticeEditor from '../../components/copyright-notice-editor.js';
import { FORM_ITEM_LAYOUT, FORM_ITEM_LAYOUT_VERTICAL } from '../../domain/constants.js';

function AbcNotationEditor({ content, onContentChanged }) {
  const { t } = useTranslation('abcNotation');
  const { abcCode, playMidi, width, copyrightNotice } = content;

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleCurrentAbcCodeChange = event => {
    const newValue = event.target.value;
    changeContent({ abcCode: newValue });
  };

  const handlePlayMidiChanged = event => {
    const { checked } = event.target;
    changeContent({ playMidi: checked });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleCurrentCopyrightNoticeChanged = newValue => {
    changeContent({ copyrightNotice: newValue });
  };

  return (
    <div>
      <Form layout="horizontal" labelAlign="left">
        <Form.Item label={t('abcCode')} {...FORM_ITEM_LAYOUT_VERTICAL}>
          <AbcInput value={abcCode} onChange={handleCurrentAbcCodeChange} debounced />
        </Form.Item>
        <Form.Item label={t('playMidi')} {...FORM_ITEM_LAYOUT}>
          <Checkbox checked={playMidi} onChange={handlePlayMidiChanged} />
        </Form.Item>
        <Form.Item label={t('common:copyrightNotice')} {...FORM_ITEM_LAYOUT}>
          <CopyrightNoticeEditor value={copyrightNotice} onChange={handleCurrentCopyrightNoticeChanged} />
        </Form.Item>
        <Form.Item
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </Form.Item>
      </Form>
    </div>
  );
}

AbcNotationEditor.propTypes = {
  ...sectionEditorProps
};

export default AbcNotationEditor;
