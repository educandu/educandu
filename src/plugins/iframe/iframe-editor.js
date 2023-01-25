import React from 'react';
import Info from '../../components/info.js';
import { Form, Input, Checkbox } from 'antd';
import { useTranslation } from 'react-i18next';
import { validateUrl } from '../../ui/validation.js';
import StepSlider from '../../components/step-slider.js';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { useNumberWithUnitFormat } from '../../components/locale-context.js';

const FormItem = Form.Item;

function IframeEditor({ content, onContentChanged }) {
  const { t } = useTranslation('iframe');
  const pxFormatter = useNumberWithUnitFormat({ unit: 'px', useGrouping: false });

  const { url, width } = content;

  const changeContent = newContentValues => {
    const newContent = { ...content, ...newContentValues };
    const isInvalidUrl = validateUrl(newContent.sourceUrl, t).validateStatus === 'error';
    onContentChanged(newContent, isInvalidUrl);
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
      <Form layout="horizontal" labelAlign="left">
        <FormItem
          {...FORM_ITEM_LAYOUT}
          label={t('common:url')}
          {...validateUrl(url, t)}
          hasFeedback
          >
          <Input value={url} onChange={handleExternalUrlValueChanged} />
        </FormItem>
        <Form.Item
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthValueChanged} />
        </Form.Item>
        <Form.Item label={t('height')} {...FORM_ITEM_LAYOUT}>
          <StepSlider
            min={100}
            step={10}
            max={1000}
            labelsStep={100}
            value={content.height}
            formatter={pxFormatter}
            onChange={handleHeightValueChanged}
            />
        </Form.Item>
        <Form.Item label={t('frame')} {...FORM_ITEM_LAYOUT}>
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
