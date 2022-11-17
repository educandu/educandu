import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { Form, Input, Checkbox, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
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
    const isInvalidUrl = validation.validateUrl(newContent.sourceUrl, t).validateStatus === 'error';
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
      <Form layout="horizontal">
        <FormItem
          {...FORM_ITEM_LAYOUT}
          label={t('common:url')}
          {...validation.validateUrl(url, t)}
          hasFeedback
          >
          <Input value={url} onChange={handleExternalUrlValueChanged} />
        </FormItem>
        <Form.Item
          label={
            <Fragment>
              <Tooltip title={t('common:widthInfo')}>
                <InfoCircleOutlined className="u-info-icon" />
              </Tooltip>
              <span>{t('common:width')}</span>
            </Fragment>
          }
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
