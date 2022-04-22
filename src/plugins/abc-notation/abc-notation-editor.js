import React from 'react';
import { Form, Input, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';

const { TextArea } = Input;

function AbcNotationEditor({ content, onContentChanged }) {
  const { t } = useTranslation('abcNotation');
  const { abcCode, maxWidth, displayMidi, text } = content;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = (newContentValues, isInvalid) => {
    onContentChanged({ ...content, ...newContentValues }, isInvalid);
  };

  const handleCurrentAbcCodeChanged = event => {
    const newValue = event.target.value;
    changeContent({ abcCode: newValue });
  };

  const handleDisplayMidiChanged = checked => {
    changeContent({ displayMidi: !!checked });
  };

  const handleMaxWidthChanged = newValue => {
    changeContent({ maxWidth: newValue });
  };

  const handleCurrentTextChanged = event => {
    const newValue = event.target.value;
    changeContent({ text: newValue });
  };

  return (
    <div>
      <Form layout="horizontal">
        <Form.Item label={t('abcCode')} {...formItemLayout}>
          <TextArea value={abcCode} onChange={handleCurrentAbcCodeChanged} autoSize={{ minRows: 5 }} />
        </Form.Item>
        <Form.Item label={t('midiSound')} {...formItemLayout}>
          <Switch checked={!!displayMidi} onChange={handleDisplayMidiChanged} />
        </Form.Item>
        <Form.Item label={t('maximumWidth')} {...formItemLayout}>
          <ObjectMaxWidthSlider defaultValue={100} value={maxWidth} onChange={handleMaxWidthChanged} />
        </Form.Item>
        <Form.Item label={t('common:copyrightInfos')} {...formItemLayout}>
          <TextArea value={text} onChange={handleCurrentTextChanged} autoSize={{ minRows: 3 }} />
        </Form.Item>
      </Form>
    </div>
  );
}

AbcNotationEditor.propTypes = {
  ...sectionEditorProps
};

export default AbcNotationEditor;
