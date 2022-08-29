import React, { Fragment } from 'react';
import { Form, Switch, Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { InfoCircleOutlined } from '@ant-design/icons';
import AbcNotation from '../../components/abc-notation.js';
import MarkdownInput from '../../components/markdown-input.js';
import InputAndPreview from '../../components/input-and-preview.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import NeverScrollingTextArea from '../../components/never-scrolling-text-area.js';

function AbcNotationEditor({ content, onContentChanged }) {
  const { t } = useTranslation('abcNotation');
  const { abcCode, width, displayMidi, copyrightNotice } = content;

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

  const handleCurrentCopyrightNoticeChanged = event => {
    const newValue = event.target.value;
    changeContent({ copyrightNotice: newValue });
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
        <Form.Item
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
          {...formItemLayout}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChanged} />
        </Form.Item>
        <Form.Item label={t('common:copyrightNotice')} {...formItemLayout}>
          <MarkdownInput value={copyrightNotice} onChange={handleCurrentCopyrightNoticeChanged} />
        </Form.Item>
      </Form>
    </div>
  );
}

AbcNotationEditor.propTypes = {
  ...sectionEditorProps
};

export default AbcNotationEditor;
