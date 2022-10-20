import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import validation from '../../ui/validation.js';
import { InfoCircleOutlined } from '@ant-design/icons';
import { FORM_ITEM_LAYOUT } from '../../domain/constants.js';
import { Form, Input, Slider, Checkbox, Tooltip } from 'antd';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';

const FormItem = Form.Item;

const tipFormatter = val => `${val}px`;
const marks = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].reduce((all, val) => {
  const node = <span>{`${val}px`}</span>;
  return { ...all, [val]: node };
}, {});

function IframeEditor({ content, onContentChanged }) {
  const { t } = useTranslation('iframe');

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
