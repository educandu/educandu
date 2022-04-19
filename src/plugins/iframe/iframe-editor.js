import React from 'react';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { Form, Input, Slider, Checkbox } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectMaxWidthSlider from '../../components/object-max-width-slider.js';

const FormItem = Form.Item;

const tipFormatter = val => `${val}px`;
const marks = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].reduce((all, val) => {
  const node = <span>{`${val}px`}</span>;
  return { ...all, [val]: node };
}, {});

function IframeEditor({ content, onContentChanged }) {
  const { t } = useTranslation('iframe');

  const { url, width } = content;
  const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 14 }
  };

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isValid = validation.validateUrl(newContent.url, t).validateStatus !== 'error';
    onContentChanged(newContent, !isValid);
  };

  const handleExternalUrlValueChanged = event => {
    const { value } = event.target;
    changeContent({ url: value });
  };

  const handleWidthValueChanged = value => {
    changeContent({ width: value });
  };

  const handleHeightValueChanged = value => {
    changeContent({ height: value });
  };

  const handleIsBorderVisibleValueChanged = event => {
    const { checked } = event.target;
    changeContent({ isBorderVisible: checked });
  };

  return (
    <div>
      <Form layout="horizontal">
        <FormItem
          {...formItemLayout}
          label={t('common:url')}
          {...validation.validateUrl(url, t)}
          hasFeedback
          >
          <Input value={url} onChange={handleExternalUrlValueChanged} />
        </FormItem>
        <Form.Item label={t('width')} {...formItemLayout}>
          <ObjectMaxWidthSlider value={width} onChange={handleWidthValueChanged} />
        </Form.Item>
        <Form.Item label={t('height')} {...formItemLayout}>
          <Slider
            min={100}
            max={1000}
            marks={marks}
            step={10}
            value={content.height}
            onChange={handleHeightValueChanged}
            tipFormatter={tipFormatter}
            />
        </Form.Item>
        <Form.Item label={t('frame')} {...formItemLayout}>
          <Checkbox checked={content.isBorderVisible} onChange={handleIsBorderVisibleValueChanged} />
        </Form.Item>
      </Form>
    </div>
  );
}

IframeEditor.propTypes = {
  ...sectionEditorProps
};

export default IframeEditor;
