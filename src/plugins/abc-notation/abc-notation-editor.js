import React from 'react';
import { Form, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import AbcNotation from '../../components/abc-notation.js';
import MarkdownInput from '../../components/markdown-input.js';
import InputAndPreview from '../../components/input-and-preview.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import NeverScrollingTextArea from '../../components/never-scrolling-text-area.js';

function AbcNotationEditor({ content, onContentChanged }) {
  const { t } = useTranslation('abcNotation');
  const { abcCode, width, displayMidi, text } = content;

  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const formItemLayoutVertical = {
    labelCol: { span: 24 },
    wrapperCol: { span: 24 }
  };

  const changeContent = newContentValues => {
    onContentChanged({ ...content, ...newContentValues }, false);
  };

  const handleCurrentAbcCodeChanged = event => {
    const newValue = event.target.value;
    changeContent({ abcCode: newValue });
  };

  const handleDisplayMidiChanged = checked => {
    changeContent({ displayMidi: !!checked });
  };

  const handleWidthChanged = newValue => {
    changeContent({ width: newValue });
  };

  const handleCurrentTextChanged = event => {
    const newValue = event.target.value;
    changeContent({ text: newValue });
  };

  return (
    <div>
      <Form layout="horizontal">
        <Form.Item label={t('abcCode')} {...formItemLayoutVertical}>
          <InputAndPreview
            input={<NeverScrollingTextArea minRows={6} value={abcCode} onChange={handleCurrentAbcCodeChanged} />}
            preview={<AbcNotation abcCode={abcCode} />}
            />
        </Form.Item>
        <Form.Item label={t('midiSound')} {...formItemLayout}>
          <Switch checked={!!displayMidi} onChange={handleDisplayMidiChanged} />
        </Form.Item>
        <Form.Item label={t('common:width')} {...formItemLayout}>
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </Form.Item>
        <Form.Item label={t('common:copyrightNotice')} {...formItemLayout}>
          <MarkdownInput value={text} onChange={handleCurrentTextChanged} />
        </Form.Item>
      </Form>
    </div>
  );
}

AbcNotationEditor.propTypes = {
  ...sectionEditorProps
};

export default AbcNotationEditor;
