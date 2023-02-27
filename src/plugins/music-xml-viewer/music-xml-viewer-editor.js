import React from 'react';
import { Form } from 'antd';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import UrlInput from '../../components/url-input.js';
import StepSlider from '../../components/step-slider.js';
import MarkdownInput from '../../components/markdown-input.js';
import { ensureAreExcluded } from '../../utils/array-utils.js';
import { MAX_ZOOM_VALUE, MIN_ZOOM_VALUE } from './constants.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { usePercentageFormat } from '../../components/locale-context.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;

function MusicXmlViewerEditor({ content, onContentChanged }) {
  const { t } = useTranslation('musicXmlViewer');
  const percentageFormatter = usePercentageFormat();

  const { sourceUrl, zoom, width, caption } = content;

  const triggerContentChanged = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleSourceUrlChange = value => {
    triggerContentChanged({ sourceUrl: value });
  };

  const handleZoomChange = newValue => {
    triggerContentChanged({ zoom: newValue });
  };

  const handleWidthChange = newValue => {
    triggerContentChanged({ width: newValue });
  };

  const handleCaptionChange = event => {
    triggerContentChanged({ caption: event.target.value });
  };

  const allowedSourceTypes = ensureAreExcluded(Object.values(SOURCE_TYPE), [SOURCE_TYPE.youtube, SOURCE_TYPE.wikimedia]);

  return (
    <div className="MusicXmlViewerEditor">
      <Form layout="horizontal" labelAlign="left">
        <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} allowedSourceTypes={allowedSourceTypes} />
        </FormItem>
        <Form.Item label={t('common:caption')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={caption} onChange={handleCaptionChange} />
        </Form.Item>
        <Form.Item label={t('zoom')} {...FORM_ITEM_LAYOUT}>
          <StepSlider
            step={0.05}
            value={zoom}
            marksStep={0.05}
            labelsStep={0.25}
            min={MIN_ZOOM_VALUE}
            max={MAX_ZOOM_VALUE}
            onChange={handleZoomChange}
            formatter={percentageFormatter}
            />
        </Form.Item>
        <Form.Item
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
      </Form>
    </div>
  );
}

MusicXmlViewerEditor.propTypes = {
  ...sectionEditorProps
};

export default MusicXmlViewerEditor;
