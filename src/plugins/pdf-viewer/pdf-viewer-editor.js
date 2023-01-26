import React from 'react';
import Info from '../../components/info.js';
import { useTranslation } from 'react-i18next';
import { Form, InputNumber, Switch } from 'antd';
import UrlInput from '../../components/url-input.js';
import MarkdownInput from '../../components/markdown-input.js';
import { sectionEditorProps } from '../../ui/default-prop-types.js';
import ObjectWidthSlider from '../../components/object-width-slider.js';
import { FORM_ITEM_LAYOUT, SOURCE_TYPE } from '../../domain/constants.js';

const FormItem = Form.Item;

function PdfViewerEditor({ content, onContentChanged }) {
  const { t } = useTranslation('pdfViewer');

  const { sourceUrl, initialPageNumber, showTextOverlay, width, caption } = content;

  const triggerContentChanged = newContentValues => {
    onContentChanged({ ...content, ...newContentValues });
  };

  const handleSourceUrlChange = value => {
    triggerContentChanged({ sourceUrl: value, initialPageNumber: 1 });
  };

  const handleInitialPageNumberChange = newInitialPageNumber => {
    triggerContentChanged({ initialPageNumber: newInitialPageNumber });
  };

  const handleShowTextOverlayChange = newShowTextOverlay => {
    triggerContentChanged({ showTextOverlay: newShowTextOverlay });
  };

  const handleWidthChange = newValue => {
    triggerContentChanged({ width: newValue });
  };

  const handleCaptionChange = event => {
    triggerContentChanged({ caption: event.target.value });
  };

  const allowedSourceTypes = [SOURCE_TYPE.none, SOURCE_TYPE.roomMedia, SOURCE_TYPE.documentMedia];

  return (
    <div className="PdfViewerEditor">
      <Form layout="horizontal" labelAlign="left">
        <FormItem {...FORM_ITEM_LAYOUT} label={t('common:url')}>
          <UrlInput value={sourceUrl} onChange={handleSourceUrlChange} allowedSourceTypes={allowedSourceTypes} />
        </FormItem>
        <Form.Item label={t('initialPageNumber')} {...FORM_ITEM_LAYOUT}>
          <InputNumber min={1} step={1} value={initialPageNumber} onChange={handleInitialPageNumberChange} />
        </Form.Item>
        <Form.Item
          label={<Info tooltip={t('showTextOverlayInfo')}>{t('showTextOverlay')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <Switch size="small" checked={showTextOverlay} onChange={handleShowTextOverlayChange} />
        </Form.Item>
        <Form.Item
          label={<Info tooltip={t('common:widthInfo')}>{t('common:width')}</Info>}
          {...FORM_ITEM_LAYOUT}
          >
          <ObjectWidthSlider value={width} onChange={handleWidthChange} />
        </Form.Item>
        <Form.Item label={t('common:caption')} {...FORM_ITEM_LAYOUT}>
          <MarkdownInput inline value={caption} onChange={handleCaptionChange} />
        </Form.Item>
      </Form>
    </div>
  );
}

PdfViewerEditor.propTypes = {
  ...sectionEditorProps
};

export default PdfViewerEditor;
